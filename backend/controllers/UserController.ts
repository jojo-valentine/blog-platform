import { Request, Response } from "express";
import { User, Profile } from "../models";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import path from "path";
const fs = require("fs");
class UserController {
  static async profile(req: Request, res: Response) {
    // const profileId = req.params._id; // หรือ req.params._id ถ้า route ใช้ _id
    // console.log({ profileId: profileId });
    // const { userId } = decode;
    let decoded: any;
    decoded = jwt.verify(
      req.cookies?.accessToken,
      process.env.JWT_SECRET as string,
    );
    // console.log({ decoded: decoded });
    const { id } = decoded;
    try {
      const user = await User.findById(id)
        .select("name email mobile")
        .populate({
          path: "profile",
          // match: { deletedAt: null },
          select: "user_id display_name bio avatar social_links",
        });
      if (!user) {
        return res.status(404).json({
          message: "not found user",
        });
      }
      return res
        .status(200)
        .json({ message: "successfully find user", user: user });
    } catch (err: any) {
      console.error("Error fetching user:", err);
      return res.status(500).json({
        message: "Something went wrong",
        error: err.message,
      });
    }
  }
  static async uploadAvatar(req: Request, res: Response) {
    const file = req.file as Express.Multer.File;
    let errors: any[] = [];

    // 1. handle multer error ก่อน
    if (req.multerError) {
      errors.push({
        field: req.multerError.field ?? "avatar", // ✅ ระบุ field ที่ error
        message: req.multerError.message ?? "please select image avatar upload",
      });
    }
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation error",
        errors,
      });
    }
    const session = await mongoose.startSession();

    try {
      let profileData: any;
      let oldAvatar = "";
      await session.withTransaction(async () => {
        const profile = await Profile.findOne({
          user_id: req.user?.userId,
        }).session(session);

        if (!profile) {
          throw new Error("Profile not found");
        }

        if (file) {
          oldAvatar = profile?.avatar || "";
          profile.avatar = file.path;
          await profile.save({ session });
        }
        profileData = profile;
      });
      // 🔥 ลบหลัง commit สำเร็จ
      if (oldAvatar && typeof oldAvatar === "string") {
        const absolute = path.resolve(process.cwd(), "." + oldAvatar);

        try {
          if (fs.existsSync(absolute) && fs.lstatSync(absolute).isFile()) {
            await fs.promises.unlink(absolute);
          }
        } catch (err) {
          console.error("Delete avatar error:", err);
        }
      }
      res.status(200).json({
        avatarUrl: profileData?.avatar,
        message: "update avatar successfully",
      });
    } catch (error: unknown) {
      console.error(
        "🔥 profileUpdate ERROR =>",
        error instanceof Error ? error.message : "Unknown error",
      );

      // ✅ ลบไฟล์ใหม่ถ้า error
      const file = req.file;
      try {
        if (file && file.path) {
          const absolute = path.resolve(file.path);

          if (fs.existsSync(absolute) && fs.lstatSync(absolute).isFile()) {
            await fs.promises.unlink(absolute);
          }
        }
      } catch (err) {
        console.error("Cleanup upload error:", err);
      }

      return res.status(500).json({
        message: error instanceof Error ? error.message : "Server error",
      });
    } finally {
      session.endSession();
    }
  }
  static async updateProfile(req: Request, res: Response) {
    const session = await mongoose.startSession();
    try {
      const { name, display_name, mobile, age, social_links } = req.body;
      const userId = req.user?.userId;

      let result;

      await session.withTransaction(async () => {
        // หา user และ profile
        const user = await User.findById(userId).session(session);
        const profileUser = await Profile.findOne({ user_id: userId }).session(
          session,
        );

        if (!profileUser) {
          throw new Error("Profile not found");
        }

        // update user
        await user?.updateOne({ $set: { name, mobile } }, { session });

        // update profile
        result = await Profile.updateOne(
          { user_id: userId },
          { $set: { display_name, bio: age, social_links: social_links } },
          { session },
        );
      });

      // ถ้า transaction สำเร็จ → commit อัตโนมัติ
      return res.status(200).json({
        message: "successfully data update",
        data: result,
      });
    } catch (err: unknown) {
      const error = err as Error;

      if (error.message === "Profile not found") {
        return res.status(404).json({ message: error.message });
      }

      // ถ้า error → rollback อัตโนมัติ
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Internal server error",
      });
    } finally {
      await session.endSession(); // ✅ ปิด session เสมอ
    }
  }
}

export default UserController;
