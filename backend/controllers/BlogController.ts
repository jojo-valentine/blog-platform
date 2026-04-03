import { Request, Response } from "express";
import { Blog, ImageBlog } from "../models";
import mongoose, { mongo } from "mongoose";
import { IImageBlog } from "../types";
import { HydratedDocument } from "mongoose";
const fs = require("fs");

class BlogController {
  static async blogDataList(req: Request, res: Response) {
    // ✅ Response

    const user = req.user;
    if (!user) {
      return res.status(401).json({
        // ✅ 401 แทน 404
        message: "Unauthorized",
      });
    }
    try {
      const blogs = await Blog.find({
        user_id: user.userId,
        deletedAt: null,
      }).populate("images");

      return res.status(200).json({
        message: "success",
        data: blogs, // ✅ return data
      });
    } catch (err: unknown) {
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
  static async blogCreate(req: Request, res: Response) {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    const parseTags = (tags: any): string[] => {
      // 👉 ถ้าเป็น array อยู่แล้ว
      if (Array.isArray(tags)) {
        return tags;
      }

      if (typeof tags === "string") {
        try {
          const parsed = JSON.parse(tags);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (error) {
          // ignore
        }
        // 2. กรณี 'travel','food'
        if (tags.includes("'")) {
          return tags
            .replace(/'/g, "") //ลบ'
            .split(",")
            .map((t: any) => t.trim());
        }
        // 3. กรณี travel,food
        return tags.split(",").map((t: any) => t.trim());
      }

      return []; // default fallback
    };
    console.log({ file: req.files, body: req.body });
    const session = await mongoose.startSession();
    try {
      const { title, content, tags, online } = req.body;

      const files = req.files as {
        coverImage?: Express.Multer.File[];
        image?: Express.Multer.File[];
      };
      const coverImage = files?.coverImage?.[0] || null;
      const images = files?.image || [];
      const blogId = (req as any).blogId.toString();

      let newBlog: any = null;

      await session.withTransaction(async () => {
        // ✅ 1. create blog
        const [blog] = await Blog.create(
          [
            {
              _id: blogId,
              user_id: user.userId,
              title,
              content,
              tags: parseTags(tags),
              online: online === true || online === "true",
              coverImage: coverImage?.path,
            },
          ],
          { session },
        );
        // ✅ 2. create images
        type ImageDoc = HydratedDocument<IImageBlog>;
        let createdImages: IImageBlog[] = [];

        if (images.length > 0) {
          createdImages = await ImageBlog.insertMany(
            images.map((img) => ({
              blog_id: blog._id,
              path: img.path,
              image: img.filename,
              uploadedBy: user.userId,
            })),
            { session },
          );
        }

        // ✅ 3. link image → blog (ถ้าคุณมี field images)
        // if (createdImages.length > 0) {
        //   blog.images = createdImages.map((img) => img._id);
        //   await blog.save({ session });
        // }

        newBlog = blog;
      });
      return res.status(201).json({
        message: "Blog created successfully",
        data: newBlog,
      });
    } catch (err: unknown) {
      // 🔥 ลบไฟล์ทั้งหมดถ้า error
      const files = req.files as {
        coverImage?: Express.Multer.File[];
        image?: Express.Multer.File[];
      };
      const allFiles = [...(files?.coverImage || []), ...(files?.image || [])];

      allFiles.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });

      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      session.endSession();
    }
  }
}

export default BlogController;
