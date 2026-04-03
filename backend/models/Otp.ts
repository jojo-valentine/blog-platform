import mongoose, { Schema, Document } from "mongoose";
// const OtpSchema = new Schema<IImageBlog>(  {
import { IOtp } from "../types";
const OtpSchema = new Schema<IOtp>(
  {
    contact: String, // หรือ mobile
    otpHash: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["register", "reset_password", "change_email", "request_new_email"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    // ⏰ หมดอายุ
    verifyAt: {
      type: Date,
      default: null,
    }, // ✅ เวลาที่ verify แล้ว
  },
  { timestamps: true },
);
export const Otp = mongoose.model<IOtp>("Otp", OtpSchema);
