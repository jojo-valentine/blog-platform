import { Request, Response } from "express";
import otpService from "../services/otpService";
import emailService from "../services/emailService";
import tokenServices from "../services/tokenService";
import mongoose, { mongo } from "mongoose";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { HasRole, Otp, Profile, ResetToken, Role } from "../models";
import { User } from "../models";
import tokenService from "../services/tokenService";
import { IRole } from "../types";
import { success } from "zod";
import crypto from "crypto";

class AuthController {
  static async register(req: Request, res: Response) {
    const session = await mongoose.startSession();
    try {
      const { email, mobile, name, password } = req.body;
      // console.log("register body:", { email, mobile, name });

      if (!email || !mobile || !name || !password) {
        return res.status(400).json({
          message: "All fields are required: email, mobile, name, password",
        });
      }

      const otp = otpService.generateOTP();

      // 🔥 1. ทำเฉพาะ DB ใน transaction
      await session.withTransaction(async () => {
        await otpService.createOtp(
          {
            contact: email,
            otp,
            type: "register",
          },
          { session },
        );
      });

      // ❗ 2. send email (ถ้า error → rollback)
      await emailService.verifyConnection();
      await emailService.sendOtpEmail(email, otp);
      // 🔥 3. hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 🔥 4. generate token
      const token = jwt.sign(
        {
          email,
          name,
          password: hashedPassword,
          mobile,
          type: "register",
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "30m" },
      );
      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // dev ใช้ false
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 60 * 1000, // 30 นาที
      });
      // ✅ 5. ส่ง token กลับ
      return res.status(200).json({
        message: "OTP sent to email",
        token,
        otp: otp,
      });
    } catch (err: any) {
      console.error("🔴 Register error:", err); // log ทั้ง object ไม่ใช่แค่ message
      return res.status(500).json({
        message: "Something went wrong",
      });
    } finally {
      session.endSession();
    }
  }

  static async verifyRegisterOtp(req: Request, res: Response) {
    const session = await mongoose.startSession();
    let responseData: any = null;
    try {
      const { otp } = req.body;
      const token = req.cookies.accessToken;

      if (!otp || !token) {
        return res.status(400).json({
          message: "OTP and token are required",
        });
      }
      // 🔥 1. decode token
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      const { email, name, password, mobile, type } = decoded;
      // 🔥 2. หา OTP ล่าสุด

      const existingUser = await User.findOne({
        $or: [{ email }, { mobile }],
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Email หรือ Mobile ถูกใช้แล้ว",
        });
      }

      const record = await Otp.findOne({
        contact: email,
        type: type,
      }).sort({ createdAt: -1 });

      if (!record) {
        return res.status(400).json({
          message: "OTP not found",
        });
      }
      // 🔥 3. เช็คหมดอายุ
      if (record.expiresAt < new Date()) {
        return res.status(400).json({
          message: "OTP expired",
        });
      }
      // 🔥 4. เช็คว่าใช้ไปแล้ว
      if (record.verifyAt) {
        return res.status(400).json({
          message: "OTP already used",
        });
      }
      // 🔥 5. compare OTP
      const isValid = await bcrypt.compare(otp, record.otpHash);
      if (!isValid) {
        return res.status(400).json({
          message: "Invalid OTP",
        });
      }

      // 🔥 6. mark verify
      await session.withTransaction(async () => {
        record.verifyAt = new Date();
        await record.save({ session });

        // 🔥 7. create user
        const [user] = await User.create(
          [
            {
              email,
              name,
              password,
              mobile,
              verifyAt: new Date(),
            },
          ],
          { session },
        );
        const role = await Role.findOne({ name: "bloger" }).session(session);
        if (!role) {
          if (!role) throw new Error("Role not found"); // ✅ throw แทน return res
        }
        // 9. assign role
        await HasRole.create(
          [{ role_id: role._id, user_id: user._id, resource: "user" }],
          { session },
        );

        await Profile.create(
          [
            {
              user_id: user._id,
              display_name: name,
            },
          ],
          { session },
        );
        responseData = user;
      });
      return res.status(200).json({
        message: "Register success",
        user: responseData,
      });
    } catch (err: any) {
      if (err.message === "Role not found") {
        return res.status(404).json({ message: "Role not found" });
      }
      return res.status(500).json({ message: "Something went wrong" });
    } finally {
      session.endSession(); // ✅ ปิด session เสมอ
    }
  }
  static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // 🔥 ดึง role
      const hasRoles = await HasRole.find({ user_id: user._id })
        .populate<{
          role_id: IRole;
        }>("role_id")
        .lean();

      // const roleData = hasRole?.role_id as IRole | null;
      const roleData = hasRoles.map((r) => r.role_id.name);

      const permissions = hasRoles.flatMap((r) => r.role_id.permissions);
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // 🔥 4. generate token
      const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: roleData, // 👈 array
        permissions, // 👈 array
        profile: {
          avatar: user.profile?.avatar || "",
          display_name: user.profile?.display_name || "",
        },
      };
      // access token อายุสั้น
      const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "15m",
      });
      // refresh token อายุยาว
      const refreshToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "7d",
      });

      // accessToken — อายุ 15 นาที
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false, // dev
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60 * 1000, // 15 นาที
      });

      // refreshToken — อายุ 7 วัน
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false, // dev
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
      });
      // ถ้า password ถูกต้อง ก็สามารถสร้าง JWT หรือ session ต่อได้
      return res.status(200).json({
        message: "Login successful",
        accessToken,
        refreshToken,
        payload,
      });
    } catch (err: any) {
      return res.status(500).json({ message: "Server error", err });
    }
  }
  static async passwordResetVerifyCheck(req: Request, res: Response) {
    const { email } = req.body;

    // console.log(email);

    const user = await User.findOne({ email }).populate({
      path: "profile",
      select: "avatar display_name",
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const session = await mongoose.startSession();
    try {
      // const otp = otpService.generateOTP();

      const rawToken = await session.withTransaction(async () => {
        return await tokenServices.generateRefreshToken(
          user._id.toString(),
          session,
        );
      });

      await emailService.verifyConnection();
      // 🔥 1. ทำเฉพาะ DB ใน transaction
      // 2. สร้าง OTP + commit
      // const record = await session.withTransaction(async () => {
      //   return await otpService.createOtp(
      //     {
      //       contact: email,
      //       otp,
      //       type: "reset_password",
      //     },
      //     { session },
      //   );
      // });

      // ❗ 2. send email (ถ้า error → rollback)
      const link = `${process.env.CLIENT_URL}/pages/forgot-password/update-password?token=${rawToken}`;
      await emailService.sendForgetPasswordEmail(email, link);
      // const token = jwt.sign(
      //   {
      //     email,
      //     type: "reset_password",
      //     otpId: record._id,
      //   },
      //   process.env.JWT_SECRET as string,
      //   { expiresIn: "30m" },
      // );

      return res.status(200).json({
        message: "you has been successfully reset otp",
        // otp: otp,
        token: rawToken,
      });
    } catch (err: any) {
      console.error("🔴 resent password error:", err); // log ทั้ง object ไม่ใช่แค่ message
      return res.status(500).json({
        message: "Something went wrong",
      });
    } finally {
      session.endSession(); // ✅ ต้องมี
    }
  }
  static async passwordVerifyResetToken(req: Request, res: Response) {
    const { token } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    try {
      const resetToken = await ResetToken.findOne({ token: hashedToken });
      if (!resetToken || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ valid: false, message: "Token expired" });
      }
      res.json({ valid: true });
    } catch (err) {
      res.status(500).json({ valid: false, message: "Server error" });
    }
  }
  static async passwordUpdate(req: Request, res: Response) {
    const session = await mongoose.startSession();
    let decoded: any;

    try {
      const { token, password, password_confirm } = req.body;
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      await session.withTransaction(async () => {
        const resetToken = await ResetToken.findOne({
          token: hashedToken,
        }).session(session);
        if (!resetToken || resetToken.expiresAt < new Date()) {
          // return res.status(400).json({ valid: false, message: "Token expired" });
          throw new Error("Invalid or expired token");
        }

        if (password !== password_confirm) {
          throw new Error("Passwords do not match");
        }
        const user = await User.findById(resetToken.user_id).session(session);
        if (!user) {
          throw new Error("not found user");
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        await user.save({ session });
        await ResetToken.deleteOne({ _id: resetToken._id }).session(session);
      });

      return res.status(200).json({
        message: "you has been update password please login again",
      });
    } catch (err: any) {
      // console.error("🔴 passwordUpdate error:", err);
      return res.status(400).json({
        message: err.message || "Something went wrong",
      });
    } finally {
      session.endSession();
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const oldToken = req.cookies?.refreshToken;

      if (!oldToken) {
        return res.status(401).json({ message: "No refresh token" });
      }

      const { newAccessToken, newRefreshToken } =
        await tokenService.rotateRefreshToken(oldToken);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      };

      // ✅ refresh token (cookie)
      res.cookie("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // ✅ access token (response body)
      return res.status(200).json({
        message: "Token refreshed",
        accessToken: newAccessToken,
      });
    } catch (err: any) {
      return res.status(401).json({
        message: "Invalid or expired refresh token",
      });
    }
  }
  static async logout(req: Request, res: Response) {
    try {
      const token = req.cookies?.refreshToken;

      if (token) {
        await tokenService.revokeRefreshToken(token);
      }

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      };

      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);

      return res.status(200).json({ message: "Logged out successfully" });
    } catch (err: any) {
      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  }
  static async updateNewPassword(req: Request, res: Response) {
    // oldPassword newpassword
    const { password_old, password_new, password_confirm } = req.body;
    console.log(password_old, password_new, password_confirm, req.user);

    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // ✅ await
        const user = await User.findById(req.user?.userId).session(session); // ✅ ใช้ session
        if (!user) throw new Error("User not found"); // ✅ throw แทน return res

        const isMatch = await bcrypt.compare(password_old, user.password);
        if (!isMatch) throw new Error("Old password is incorrect"); // ✅ throw แทน return res

        const isMatchNewPassword = password_new === password_confirm;
        if (!isMatchNewPassword) {
          throw new Error("New passwords do not match");
        }

        user.password = await bcrypt.hash(password_new, 10);
        await user.save({ session }); // ✅ ใช้ session
      });
      return res.status(200).json({
        message: "successfully update",
      });
    } catch (error: unknown) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Server error",
      });
    } finally {
      session.endSession();
    }
  }
  static async requestChangeEmail(req: Request, res: Response) {
    const { email } = req.body;
    const session = await mongoose.startSession();

    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user.userId;

      let rawToken: string;

      // ✅ ทำเฉพาะ DB ใน transaction
      await session.withTransaction(async () => {
        const existingUser = await User.findOne({ email }).session(session);
        if (existingUser) {
          throw new Error("Email already in use");
        }

        rawToken = await tokenServices.generateTokenNewEmail(
          userId.toString(),
          session,
          email,
        );
      });

      // ✅ ออกจาก transaction แล้วค่อยส่ง email
      const link = `${process.env.CLIENT_URL}/pages/confirm-change-email?token=${rawToken!}`;

      await emailService.verifyConnection();
      await emailService.senNewEmail(email, link);

      return res.status(200).json({
        message: "Send new email successfully",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === "Email already in use") {
          return res.status(400).json({ message: err.message });
        }
      }

      return res.status(500).json({
        message: "Server error",
      });
    } finally {
      session.endSession();
    }
  }
  static async changeEmail(req: Request, res: Response) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const { token } = req.body;
        // const token = req.cookies?.changeEmailToken;
        if (!token) {
          throw new Error("Unauthorized");
        }

        const hashedToken = crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");
        const resetToken = await ResetToken.findOne({
          token: hashedToken,
        }).session(session);
        if (!resetToken || resetToken.expiresAt < new Date()) {
          // return res.status(400).json({ valid: false, message: "Token expired" });
          throw new Error("Invalid or expired token");
        }

        const user = await User.findById(resetToken.user_id).session(session);
        if (!user) {
          throw new Error("not found user");
        }
        const existing = await User.findOne({
          email: resetToken.contact,
          _id: { $ne: user._id }, // 👈 ยกเว้นตัวเอง
        }).session(session);
        if (existing) {
          throw new Error("Email already in use");
        }
        user.email = resetToken.contact;
        await user.save({ session });

        // 🔥 ลบ token กัน reuse
        await ResetToken.deleteOne({ _id: resetToken._id }).session(session);
      });

      return res.status(200).json({
        message: "successfury update email",
      });
    } catch (err: unknown) {
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      session.endSession();
    }
  }
  static async refreshUser(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token" });
      }

      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET as string,
      ) as JwtPayload & { id: string };
      // console.log(decoded);

      const user = await User.findById(decoded.id).populate({
        path: "profile",
        select: "avatar display_name",
      });
      if (!user) {
        res.clearCookie("refreshToken");
        res.clearCookie("accessToken");

        return res.status(401).json({
          message: "User not found",
          forceLogout: true,
        });
      }
      // // 🔥 ดึง role
      const hasRoles = await HasRole.find({ user_id: user._id })
        .populate<{
          role_id: IRole;
        }>("role_id")
        .lean();

      const roleData = hasRoles.map((r) => r.role_id.name);

      const permissions = hasRoles.flatMap((r) => r.role_id.permissions);

      // // 🔥 4. generate token
      const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: roleData, // 👈 array
        permissions, // 👈 array
        profile: {
          avatar: user.profile?.avatar || "",
          display_name: user.profile?.display_name || "",
        },
      };
      const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "15m",
      });

      const newRefreshToken = jwt.sign(
        payload,
        process.env.JWT_SECRET as string,
        {
          expiresIn: "7d",
        },
      );

      // ✅ set cookies
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({
        message: "refresh user successful",
        accessToken,
        refreshToken,
        payload,
      });
    } catch (err: unknown) {
      res.clearCookie("newRefreshToken", {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      });
      console.error(
        "Refresh error:",
        err instanceof Error ? err.message : "Unknown error",
      );
      return res.status(401).json({
        message: err instanceof Error ? err.message : "Unknown error",
        forceLogout: true,
      });
    }
  }
}

export default AuthController;
