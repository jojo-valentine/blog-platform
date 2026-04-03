import bcrypt from "bcrypt";
import { Otp } from "../models";
import { IOtp } from "../types";
import { ClientSession } from "mongoose";

class otpService {
  // 🔢 generate OTP 6 หลัก
  static generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // ⏰ เวลาหมดอายุ
  static getExpiryTime = (minutes = 5): Date => {
    return new Date(Date.now() + minutes * 60 * 1000);
  };

  // 🔐 hash OTP
  static hashOTP = async (otp: string): Promise<string> => {
    return await bcrypt.hash(otp, 10);
  };
  // 🔍 compare OTP
  static compareOTP = async (otp: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(otp, hash);
  };

  // 💾 create OTP
  static createOtp = async (
    {
      contact,
      otp,
      type,
    }: {
      contact: string;
      otp: string;
      type: IOtp["type"];
    },
    options?: { session?: ClientSession },
  ) => {
    const session = options?.session;

    const otpHash = await this.hashOTP(otp);

    // 🧹 ลบ OTP เก่าทั้งหมดของ user นี้
    await Otp.deleteMany({ contact, type }, { session });

    // 💾 save ใหม่
    const record = await Otp.create(
      [
        {
          contact,
          otpHash,
          type,
          expiresAt: this.getExpiryTime(),
        },
      ],
      { session },
    );

    return record[0];
  };
}
export default otpService;
