import mongoose, { Document } from "mongoose";
export interface IImageCategory extends Document {
  name: string;
  uploadedBy?: mongoose.Types.ObjectId; // optional: ใคร upload
  deletedAt: Date;
}
