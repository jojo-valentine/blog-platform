// models/Blog.ts
import mongoose, { Schema, Document } from "mongoose";
import { IBlog } from "../types/blog";

const BlogSchema = new Schema<IBlog>(
  {
    // ✅ relation ถูก
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags_id: [{ type: Schema.Types.ObjectId, ref: "ImageCategory" }],
    cover_image: [String],
    is_online: { type: Boolean, default: false },
    suspended: { type: Boolean, default: false },
    deletedAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);

// ✅ virtual สำหรับ images
BlogSchema.virtual("images", {
  ref: "ImageBlog", // ✅ ต้องตรง model
  localField: "_id",
  foreignField: "blog_id",
});

BlogSchema.set("toObject", { virtuals: true });
BlogSchema.set("toJSON", { virtuals: true });
export const Blog = mongoose.model<IBlog>("Blog", BlogSchema);
