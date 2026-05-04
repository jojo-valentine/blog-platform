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

      // search
      const q = (req.query.search as string)?.trim();

      const filter: any = {
        user_id: user.userId,
        deletedAt: null,
      };

      // ✅ category parse
      // const categoryRaw = (req.query.category || req.query["category[]"]) as
      //   | string
      //   | string[]
      //   | undefined;
      const categoryRaw = req.query.category || req.query["category[]"];

      const category = Array.isArray(categoryRaw)
        ? categoryRaw
        : typeof categoryRaw === "string"
          ? categoryRaw.split(",")
          : [];

      // ✅ category filter (ต้องอยู่นอก if q)
      // const validIds = category
      //   .filter((id) => mongoose.Types.ObjectId.isValid(id))
      //   .map((id) => new mongoose.Types.ObjectId(id));

      if (category.length > 0) {
        filter.tags_id = { $all: category };
      }

      // ✅ search filter
      if (q) {
        const orConditions: any[] = [
          { title: { $regex: q, $options: "i" } },
          { content: { $regex: q, $options: "i" } },
        ];

        if (mongoose.Types.ObjectId.isValid(q)) {
          orConditions.push({ _id: new mongoose.Types.ObjectId(q) });
        }

        filter.$or = orConditions;
      }

      const [blogs, total] = await Promise.all([
        Blog.find(filter)
          .select(
            "title content tags_id cover_image  suspended is_online createdAt deletedAt",
          )
          .populate({
            path: "images",
            match: { deletedAt: null },
            select: "path ",
          })
          .populate({
            path: "tags_id", // 👈 สำคัญ
            select: "name", // เอาเฉพาะ field ที่ต้องใช้
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
      // }).populate({ path: "images", match: { deletedAt: { $exists: false } } }) errror 2323?3423 ;

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
        return tags.split(",").map((t: string) => t.trim());
      }

      return []; // default fallback
    };
    // console.log({ file: req.files, body: req.body });
    const session = await mongoose.startSession();
    try {
      const { title, content, categories } = req.body;

      const files = req.files as {
        gallery?: Express.Multer.File[];
        cover_image?: Express.Multer.File[];
      };
      const images = files?.gallery || [];
      const coverImage = files?.cover_image || [];
      const blogId = (req as any).blogId.toString();

      let newBlog: any = null;

      await session.withTransaction(async () => {
        // ✅ 1. create blog
        const blog = new Blog({
          _id: blogId,
          user_id: new mongoose.Types.ObjectId(user.userId),
          title,
          content,
          tags_id: parseTags(categories).map(
            (id) => new mongoose.Types.ObjectId(id),
          ),
          suspended: false,
          cover_image: coverImage?.[0]?.path,
        });

        await blog.save({ session });
        // ✅ 2. create images
        type ImageDoc = HydratedDocument<IImageBlog>;
        let createdImages: IImageBlog[] = [];
        // ✅ แก้

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

        newBlog = blog;
      });
      return res.status(201).json({
        message: "Blog created successfully",
        data: newBlog,
      });
    } catch (err: unknown) {
      // 🔥 ลบไฟล์ทั้งหมดถ้า error
      const files = req.files as {
        cover_image?: Express.Multer.File[];
        image?: Express.Multer.File[];
      };
      const allFiles = [...(files?.cover_image || []), ...(files?.image || [])];

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
          match: { deletedAt: null },
          select: "path ",
        })
        .populate({
          path: "tags_id", // 👈 สำคัญ
          select: "name", // เอาเฉพาะ field ที่ต้องใช้
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
      cover_image?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    };
    const gallery = files.gallery || [];

    // เก็บไว้ลบทีหลัง (หลัง commit)
    let oldCoverToDelete = "";

    const parseTags = (tags: any): string[] => {
      if (Array.isArray(tags)) return tags;
      if (typeof tags === "string") {
        try {
          const parsed = JSON.parse(tags);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
        if (tags.includes("'")) {
          return tags
            .replace(/'/g, "")
            .split(",")
            .map((t: any) => t.trim());
        }
        return tags.split(",").map((t: any) => t.trim());
      }
      return [];
    };

    try {
      await session.withTransaction(async () => {
        const { title, content, categories } = req.body;

        const blogPost = await Blog.findOne({
          _id: idBlog,
          deletedAt: null,
          user_id: userId,
        }).session(session);

        if (!blogPost) throw new Error("Blog not found");

        const hasNewCover = !!files.cover_image?.[0];

        let coverImage: string[] = Array.isArray(blogPost.cover_image)
          ? blogPost.cover_image
          : [];

        if (hasNewCover) {
          const uploaded = files.cover_image![0];
          // ✅ เก็บ path เก่าไว้ลบทีหลัง ไม่ลบใน transaction
          oldCoverToDelete = blogPost.cover_image?.[0] || "";
          coverImage = [uploaded.path];
        }

        await blogPost.updateOne(
          {
            title,
            content,
            tags_id: parseTags(categories),
            cover_image: coverImage,
          },
          { session },
        );

        if (gallery.length > 0) {
          await ImageBlog.insertMany(
            gallery.map((img) => ({
              blog_id: blogPost._id,
              path: img.path,
              uploadedBy: userId,
            })),
            { session },
          );
        }
      });

      // ✅ ลบรูปเก่าหลัง commit สำเร็จ
      if (oldCoverToDelete) {
        const absolutePath = path.join(
          process.cwd(),
          oldCoverToDelete.replace(/^\//, ""),
        );
        try {
          if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
        } catch (err) {
          console.error("Delete old cover error:", err);
        }
      }

      return res.status(200).json({ message: "update success" });
    } catch (err: unknown) {
      // ✅ ลบไฟล์ใหม่ที่ upload มาถ้า transaction fail
      const allFiles = [
        ...(files?.cover_image || []),
        ...(files?.gallery || []),
      ];
      allFiles.forEach((file) => {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch {}
      });

      if (err instanceof Error && err.message === "Blog not found") {
        return res.status(404).json({ message: "Blog not found" });
      }

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

    try {
      const { is_online } = req.body;

      if (typeof is_online !== "boolean") {
        return res.status(400).json({
          message: "is_online must be boolean",
        });
      }

      const blog = await Blog.findOneAndUpdate(
        {
          _id: blogId,
          user_id: userId,
          deletedAt: null,
        },
        {
          is_online,
        },
        {
          new: true,
        },
      );

      if (!blog) {
        return res.status(404).json({
          message: "Blog not found",
        });
      }

      return res.status(200).json({
        message: `Blog is now ${blog.is_online ? "online" : "offline"}`,
        data: blog.is_online,
      });
    } catch (err: any) {
      return res.status(500).json({
        message: "Server error",
        error: err.message,
      });
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
