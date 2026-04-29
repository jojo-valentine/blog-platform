// models/Blog.ts
import mongoose, { Schema, Document } from "mongoose";
import { IBlog } from "../types/blog";

const BlogSchema = new Schema<IBlog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags_id: [{ type: Schema.Types.ObjectId, ref: "ImageCategory" }],
    coverImage: [String],
    online: { type: Boolean, default: false },
    suspended: { type: Boolean, default: false },
    deletedAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);
BlogSchema.virtual("images", {
  ref: "ImageBlog",
  localField: "_id",
  foreignField: "blog_id",
  justOne: false,
});
BlogSchema.set("toObject", { virtuals: true });
BlogSchema.set("toJSON", { virtuals: true });
export const Blog = mongoose.model<IBlog>("Blog", BlogSchema);
