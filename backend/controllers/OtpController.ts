import { Request, Response } from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import otpService from "../services/otpService";
import jwt from "jsonwebtoken";
import { Otp } from "../models";
import emailService from "../services/emailService";
import { IOtp } from "../types";
class otpController {
  static async requestOTP(req: Request, res: Response) {}
  static async otpsent(req: Request, res: Response) {
    try {
      // const { token } = req.body;
      const token = req.cookies?.resendContactToken;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!token) {
        return res.status(400).json({
          message: " token are required",
        });
      }
      let decoded: any;
      // let email: string;
      // let type: string;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        // email = decoded.email;
        // type = decoded.type;
      } catch (err: any) {
        // 🔥 แยก error ของ jwt
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            message: "Token expired, please register again",
          });
        }

        if (err.name === "JsonWebTokenError") {
          return res.status(401).json({
            message: "Invalid token",
          });
        }

        throw err; // error อื่นโยนต่อ
      }

      const { email, type } = decoded as { email: string; type: IOtp["type"] };
      // 🔥 เช็ค OTP ล่าสุด
      const lastOtp = await Otp.findOne({
        contact: email,
        type: type,
      }).sort({ createdAt: -1 });
      // console.log(lastOtp);

      // 🔒 กัน spam (60 วิ)
      if (
        lastOtp &&
        Date.now() - new Date(lastOtp.createdAt as Date).getTime() < 60_000
      ) {
        return res.status(400).json({
          message: "Please wait before requesting again",
        });
      }
      const allowedTypes = ["register", "reset_password", "request_new_email"];

      if (!allowedTypes.includes(type)) {
        return res.status(400).json({
          message: "Invalid OTP type",
        });
      }
      // 🔥 generate ใหม่
      const otp = otpService.generateOTP();

      // 🔥 ลบของเก่า + create ใหม่
      await otpService.createOtp({
        contact: email,
        otp,
        type: type as IOtp["type"],
      });
      // 🔥 ส่ง email
      await emailService.sendOtpEmail(email, otp);

      return res.status(200).json({
        message: "OTP resent successfully",
      });
    } catch (err: any) {
      console.error("🔴 Register error:", err); // log ทั้ง object ไม่ใช่แค่ message
      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  }
  static async otpvarifyRegister(res: Response, req: Request) {}
}
export default otpController;
