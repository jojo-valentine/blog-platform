// models/Image.ts
import mongoose, { Schema, Document } from "mongoose";
import { IImageCategory } from "../types/imageCategory";

const ImageCategorySchema = new Schema<IImageCategory>(
  {
    name: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const ImageCategory = mongoose.model<IImageCategory>(
  "ImageCategory",
  ImageCategorySchema,
);
