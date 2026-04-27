import mongoose, { Schema, Document } from "mongoose";

import { IResetToken } from "../types/resetToken";

const ResetTokenSchema = new Schema<IResetToken>({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  contact: { type: String, required: false, unique: false },
  expiresAt: { type: Date, required: true },
});

ResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const ResetToken = mongoose.model<IResetToken>(
  "ResetToken",
  ResetTokenSchema,
);
