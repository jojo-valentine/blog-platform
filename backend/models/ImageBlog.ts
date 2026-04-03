// models/Image.ts
import mongoose, { Schema, Document } from "mongoose";
import { IImageBlog } from "../types/imageBlog";

const ImageBlogSchema = new Schema<IImageBlog>(
  {
    blog_id: { type: Schema.Types.ObjectId, ref: "Blog" },
    // url: { type: String, required: true },
    path: { type: String, required: true },
    image: { type: String, required: true },
    caption: String,
    alt: String,
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const ImageBlog = mongoose.model<IImageBlog>(
  "ImageBlog",
  ImageBlogSchema,
);
