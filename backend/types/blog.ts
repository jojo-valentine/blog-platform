import mongoose, { Document } from "mongoose";
export interface IBlog extends Document {
  user_id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  coverImage?: string;
  online: boolean;
  images: mongoose.Types.ObjectId[]; // อ้างอิงไปยัง Image
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
