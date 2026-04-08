import { Request, Response } from "express";
import { Blog, ImageBlog } from "../models";
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
      const filter: any = { deletedAt: null };

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
      if (tags) {
        filter.tags = { $in: [tags] };
      }
      // ✅ query
      const [blogs, total] = await Promise.all([
        Blog.find(filter)
          .select(
            "title content coverImage tags suspended online createdAt deletedAt",
          )
          .populate({
            path: "images",
            // match: { deletedAt: null },
            select: "path image",
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

    const { action } = req.body;
    try {
      await session.withTransaction(async () => {
        const blogId = req.params.id;
        if (!blogId) {
          throw new Error("blogId not provided");
        }

        const blog = await Blog.findById(blogId).session(session);
        if (!blog) {
          throw new Error("blog not Found");
        }
        if (action === "suspend") {
          blog.suspended = true;
        } else if (action === "unsuspend") {
          blog.suspended = false;
        } else {
          throw new Error("Invalid action");
        }

        await blog.save({ session });
      });
      return res.status(200).json({
        message: `Successfully updated blog ${action === "suspend" ? "suspend" : "unsuspend"}`,
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
}
export default AdminController;
