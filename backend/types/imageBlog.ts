import mongoose, { Document } from "mongoose";
export interface IImageBlog extends Document {
  blog_id?: mongoose.Types.ObjectId; // อ้างอิง blog ที่รูปนี้ belong
  //   url: string;
  path: string;
  image: string;
  caption?: string;
  alt?: string;
  uploadedBy?: mongoose.Types.ObjectId; // optional: ใคร upload
}
