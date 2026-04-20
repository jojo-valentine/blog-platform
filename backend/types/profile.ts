import mongoose, { Document } from "mongoose";
export interface IProfile extends Document {
  user_id: mongoose.Types.ObjectId;
  display_name: string;
  bio?: string;
  avatar?: string;
  socialLinks?: string[];
}
