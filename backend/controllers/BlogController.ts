import { Request, Response } from "express";
import { Blog, ImageBlog } from "../models";
import mongoose, { mongo } from "mongoose";
import { IImageBlog } from "../types";
import { HydratedDocument } from "mongoose";
import path from "path";
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
      // ✅ pagination
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const skip = (page - 1) * limit;

      // ✅ search
      const q = (req.query.search as string)?.trim();
      const tags = (req.query.tags as string)?.split(",");
      const filter: any = {
        user_id: user.userId,
        deletedAt: null,
      };
      // 🔥 ถ้ามี keyword
      if (q) {
        const orConditions: any[] = [
          { title: { $regex: q, $options: "i" } },
          { content: { $regex: q, $options: "i" } },
          { tags: { $elemMatch: { $regex: q, $options: "i" } } },
        ];

        // 🔥 ถ้า q เป็น ObjectId
        if (mongoose.Types.ObjectId.isValid(q)) {
          orConditions.push({ _id: new mongoose.Types.ObjectId(q) });
        }

        filter.$or = orConditions;
      }
      if (tags && tags.length > 0) {
        filter.tags = { $in: tags };
      }
      const [blogs, total] = await Promise.all([
        Blog.find(filter)
          .select(
            "title content coverImage tags suspended online createdAt deletedAt",
          )
          .populate({
            path: "images",
            match: { deletedAt: null },
            select: "path image",
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Blog.countDocuments(filter),
      ]);
      // const blogs = await Blog.find({
      //   user_id: user.userId,
      //   deletedAt: { $exists: false },
      // }).populate({ path: "images", match: { deletedAt: { $exists: false } } });

      return res.status(200).json({
        message: "success",
        data: blogs,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
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
    // console.log({ file: req.files, body: req.body });
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
              suspended: false,
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
              // image: img.filename,
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
  static async blogEdit(req: Request, res: Response) {
    const idBlog = req.params.id;
    const userId = req.user?.userId;
    try {
      const blog = await Blog.findOne({
        _id: idBlog,
        deletedAt: null,
        user_id: userId,
      })
        .select("-deletedAt -createdAt -updatedAt -__v")
        .populate({
          path: "images",
          select: "path image caption deleteAt", //-_id 🔥 กำหนด resource
          match: { deletedAt: { $exists: false } },
        });
      if (!blog) {
        return res.status(404).json({
          message: "not found Blog",
        });
      }
      return res.status(200).json({
        message: "data find success",
        data: blog,
      });
    } catch (err: unknown) {
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
  static async blogDeleteImage(req: Request, res: Response) {
    const imageId = req.params.id;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const image = await ImageBlog.findById(imageId).session(session);
        if (!image) {
          throw new Error("Image not found");
        }
        if (image.deletedAt) {
          throw new Error("Image already deleted");
        }
        image.deletedAt = new Date(); // or now()
        await image.save({ session });

        // 🔥 join path แบบปลอดภัย
        const relativePath = path.join(image.path || "");
        // 🔥 ลบไฟล์
        const deleteFile = (relativePath: string) => {
          const absolute = path.join(process.cwd(), relativePath);
          if (fs.existsSync(absolute)) {
            fs.unlinkSync(absolute);
          }
        };
        deleteFile(relativePath);
      });
      return res.status(200).json({ message: "Image deleted successfully" });
    } catch (err: unknown) {
      res.status(500).json({
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      session.endSession();
    }
  }
  static async blogUpdate(req: Request, res: Response) {
    const userId = req.user?.userId;
    const idBlog = req.params.id;
    const session = await mongoose.startSession();
    const files = req.files as {
      coverImage?: Express.Multer.File[];
      image?: Express.Multer.File[];
    };
    const coverImage = files?.coverImage?.[0] || null;
    const images = files?.image || [];
    try {
      await session.withTransaction(async () => {
        const { title, content, tags, online } = req.body;

        const blogPost = await Blog.findOne({
          _id: idBlog,
          deletedAt: null,
          user_id: userId,
        }).session(session);
        if (!blogPost) {
          throw new Error("Blog not found");
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
        const oldTags = parseTags(blogPost.tags ?? "");
        const newTags = parseTags(req.body.tags ?? "");
        let mergedTags: string[] = [];
        // 2. เทียบว่ามีการเปลี่ยนแปลงหรือไม่
        const isChanged =
          oldTags.length !== newTags.length ||
          oldTags.some((tag) => !newTags.includes(tag));
        if (isChanged) {
          // // 3. หา tag ที่เพิ่มเข้ามา
          const addedTags = newTags.filter((tag) => !oldTags.includes(tag));
          // ✅ merge แล้ว dedup ด้วย Set
          // const mergedTags = [...new Set([...oldTags, ...newTags])];
          const oldTagsSet = new Set(oldTags);
          addedTags.forEach((tag) => oldTagsSet.add(tag));
          mergedTags = Array.from(oldTagsSet);
          // console.log(mergedTags);
        }

        let oldCoverImage: string = "";
        let newCoverImage: string = "";

        if (files["coverImage"]?.[0]) {
          // ค่าเดิมจาก DB
          oldCoverImage = blogPost.coverImage?.[0] ?? "";
          // สร้าง absolute path จาก process.cwd()
          const absolutePath = path.join(process.cwd(), oldCoverImage);

          // ลบไฟล์เก่าออกถ้ามี
          if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            // console.log("Old cover image deleted:", absolutePath);
          }

          // ค่าใหม่จาก Multer (ไฟล์ที่ upload เข้ามา)
          const uploadedCover = files["coverImage"][0]; // coverImage เป็น array
          newCoverImage = uploadedCover.path; // หรือ uploadedCover.filename ตามที่คุณเก็บ
        }

        await blogPost.updateOne(
          {
            title,
            content,
            tags: isChanged ? mergedTags : oldTags,
            online: online === true || online === "true",
            coverImage: newCoverImage || oldCoverImage,
          },
          { session },
        );

        let createdImages: IImageBlog[] = [];
        if (files["image"] || images.length > 0) {
          createdImages = await ImageBlog.insertMany(
            images.map((img) => ({
              blog_id: blogPost._id,
              path: img.path,
              uploadedBy: userId,
            })),
            { session },
          );
        }
        // await Blog
      });
      return res.status(200).json({
        message: "update successs",
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
  static async blogTogglePost(req: Request, res: Response) {
    const blogId = req.params.id;
    const userId = req.user?.userId;
    const session = await mongoose.startSession();
    let newStatus: boolean = false;
    try {
      await session.withTransaction(async () => {
        const blog = await Blog.findOne({
          _id: blogId,
          deletedAt: null,
          user_id: userId,
        }).session(session); // ✅ .session() แทน options object

        if (!blog) {
          throw new Error("Image not found");
        }
        newStatus = !blog.online;
        await Blog.updateOne(
          { _id: blogId }, // ✅ มี filter
          { online: newStatus },
          { session },
        );
      });

      return res.status(200).json({
        message: `Blog is now ${newStatus ? "online" : "offline"}`,
      });
    } catch (err: unknown) {
      res.status(500).json({
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      session.endSession();
    }
  }
  static async blogDeletePost(req: Request, res: Response) {
    const blogId = req.params.id;
    const userId = req.user?.userId;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const blog = await Blog.findOne({
          _id: blogId,
          user_id: userId, // ✅ เช็คว่าเป็นของ user นี้
          deletedAt: null, // ✅ ยังไม่ถูกลบ
        }).session(session);
        if (!blog) throw new Error("Blog not found");

        await Blog.findByIdAndUpdate(
          blogId, // ✅ มี filter
          { deletedAt: new Date() },
          { session },
        );
      });
      return res.status(200).json({ message: "Blog deleted successfully" });
    } catch (err: unknown) {
      res.status(500).json({
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      session.endSession();
    }
  }
}

export default BlogController;
