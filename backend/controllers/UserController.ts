import { Request, Response } from "express";
import { User, Profile } from "../models";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
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
      const user = await User.findById(id).populate("profile");
      if (!user) {
        return res.status(404).json({
          message: "not found user",
        });
      }
      return res
        .status(200)
        .json({ message: "successfury find user", user: user });
    } catch (err: any) {
      console.error("Error fetching user:", err);
      return res.status(500).json({
        message: "Something went wrong",
        error: err.message,
      });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    const file = req.file;
    const body = req.body;
    // const errors = [];

    console.log({
      file: file,
      body: body,
      user: req.user,
    });
    const session = await mongoose.startSession();
    try {
      const profileUser = await Profile.findOne({
        user_id: req.user?.userId,
      }).session(session);

      if (!profileUser) {
        throw new Error("Profile not found");
      }
      function mapBodyToProfile(body: any) {
        return {
          bio: body.age, // map bio -> age
          displayName: body.displayName, // map name -> name
          socialLinks: body.linkAccounts || [], // map email -> email
          // เพิ่ม mapping อื่น ๆ ตาม schema
        };
      }

      await Profile.findOneAndUpdate(
        { user_id: req.user?.userId },
        {
          ...mapBodyToProfile(body),
          ...(file && { avatar: file.filename }), // ✅ update avatar ถ้ามีไฟล์
        },
        { new: true, session },
      );

      return res.status(200).json({
        message: "successfury data update",
      });
    } catch (err: any) {
      console.error("🔥 profileUpdate ERROR =>", err);

      // ลบไฟล์ถ้า error
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      if (err.message === "Profile not found") {
        return res.status(404).json({ message: "Profile not found" });
      }

      return res.status(500).json({ message: "Internal server error" });
    } finally {
      session.endSession(); // ✅ ปิด session เสมอ 
    }
  }

  
}

export default UserController;
