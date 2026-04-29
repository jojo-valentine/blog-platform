import mongoose, { Document, Types } from "mongoose";
export interface IBlog extends Document {

  user_id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  tags_id: mongoose.Types.ObjectId[];
  coverImage?: string;
  online: boolean;
  suspended: boolean;
  images: mongoose.Types.ObjectId[]; // อ้างอิงไปยัง Image
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
