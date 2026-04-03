import mongoose, { Document, Schema, model } from "mongoose";

export interface IOtp extends Document {
  contact: string; // หรือ mobile
  otpHash: string;
  type: "register" | "reset_password" | "change_email" | "request_new_email";
  expiresAt: Date; // ⏰ หมดอายุ
  verifyAt?: Date | null; // ✅ เวลาที่ verify แล้ว
  createdAt: Date | null; // 👈 ไม่ต้องใส่ ?
  updatedAt: Date | null;
}
