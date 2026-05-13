import { Request, Response } from "express";
import { Blog, ImageBlog, ImageCategory } from "../models";
import mongoose, { mongo } from "mongoose";

class AdminController {
  static async listBlog(req: Request, res: Response) {
    try {
      // ✅ pagination
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const skip = (page - 1) * limit;

      // ✅ search
      const q = (req.query.search as string)?.trim();
      const tags = (req.query.tags as string)?.split(",");
      const filter: any = {};

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
      const categoryRaw = req.query.category || req.query["category[]"];

      const category = Array.isArray(categoryRaw)
        ? categoryRaw
        : typeof categoryRaw === "string"
          ? categoryRaw.split(",")
          : [];

      if (category.length > 0) {
        filter.tags_id = { $all: category };
      }
      // ✅ query
      const [blogs, total] = await Promise.all([
        Blog.find(filter)
          .select(
            "title content cover_image tag_id  suspended is_online createdAt deletedAt",
          )
          .populate({
            path: "images",
            match: { deletedAt: null },
            select: "path image",
          })
          .populate({
            path: "tags_id",
            // match: { deletedAt: null },
            select: "name",
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        Blog.countDocuments(filter),
      ]);

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
  static async toggleBlogPostSuspension(req: Request, res: Response) {
    const session = await mongoose.startSession();

    const { suspended } = req.body;

    try {
      await session.withTransaction(async () => {
        const blogId = req.params.id;

        if (!blogId) {
          throw new Error("blogId not provided");
        }

        const blog = await Blog.findById(blogId).session(session);

        if (!blog) {
          throw new Error("blog not found");
        }

        if (typeof suspended !== "boolean") {
          throw new Error("Invalid suspended value");
        }

        blog.suspended = suspended;

        await blog.save({
          session,
        });
      });

      return res.status(200).json({
        message: suspended
          ? "Successfully suspended blog"
          : "Successfully unsuspended blog",
      });
    } catch (err: unknown) {
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      session.endSession();
    }
  }
  static async listCategory(req: Request, res: Response) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const skip = (page - 1) * limit;
      const q = (req.query.search as string)?.trim();
      const filter: any = {};

      // search filter
      if (q) {
        const orConditions: any[] = [
          {
            name: {
              $regex: q,
              $options: "i",
            },
          },
        ];
        // search by ObjectId
        if (mongoose.Types.ObjectId.isValid(q)) {
          orConditions.push({
            _id: new mongoose.Types.ObjectId(q),
          });
        }

        filter.$or = orConditions;
      }
      const [categories, total] = await Promise.all([
        ImageCategory.find(filter)
          .select("_id name uploadedBy createdAt updatedAt deletedAt")
          .populate({
            path: "uploadedBy",
            select: "name",
          })

          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        ImageCategory.countDocuments(filter),
      ]);
      return res.status(200).json({
        message: "success",
        data: categories,
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
  static async storeCategory(req: Request, res: Response) {
    const session = await mongoose.startSession();
    try {
      const { name } = req.body;
      let data: any = null;
      await session.withTransaction(async () => {
        const category = new ImageCategory({ name });
        await category.save({ session });
        data = category;
      });
      return res.status(201).json({
        message: "Category created successfully",
        data: data,
      });
    } catch (err: unknown) {
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      session.endSession();
    }
  }
  static async updateCategory(req: Request, res: Response) {
    let session: mongoose.ClientSession | null = null;
    try {
      const { name } = req.body;
      const id = req.params.id;

      session = await mongoose.startSession();

      let data: any = null;

      await session.withTransaction(async () => {
        const category = await ImageCategory.findOneAndUpdate(
          { _id: id }, // filter
          { name: name, uploadedBy: req.user?.userId, updatedAt: new Date() }, // update fields
          { new: true, session }, // options
        );
        data = category;
      });

      if (!data) {
        return res.status(404).json({
          message: "Category not found",
        });
      }

      return res.status(200).json({
        message: "Category updated successfully",
        data,
      });
    } catch (err: unknown) {
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }
  static async deleteCategory(req: Request, res: Response) {
    const session = await mongoose.startSession();
    try {
      const id = req.params.id;
      let deleted: any = null;

      await session.withTransaction(async () => {
        // ✅ soft delete
        deleted = await ImageCategory.findOneAndUpdate(
          { _id: id, deletedAt: null },
          { deletedAt: new Date() },
          { new: true, session },
        );

        if (!deleted) throw new Error("Category not found");
      });

      return res.status(200).json({
        message: "Category deleted successfully",
        data: deleted,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "Category not found") {
        return res.status(404).json({ message: "Category not found" });
      }
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      session.endSession();
    }
  }
  static async destroyCategory(req: Request, res: Response) {
    const session = await mongoose.startSession();
    try {
      const id = req.params.id;
      let deleted: any = null;

      await session.withTransaction(async () => {
        // ✅ hard delete
        deleted = await ImageCategory.findOneAndDelete(
          { _id: id },
          { session },
        );

        if (!deleted) throw new Error("Category not found");
      });

      return res.status(200).json({
        message: "Category permanently deleted",
        data: deleted,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "Category not found") {
        return res.status(404).json({ message: "Category not found" });
      }
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      session.endSession();
    }
  }
}
export default AdminController;
