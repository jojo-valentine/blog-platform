import mongoose from "mongoose";

export interface IResetToken extends Document {
  user_id: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
}