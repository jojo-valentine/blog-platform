import { Request, Response } from "express";
import { Blog, HasRole, ImageBlog, ImageCategory, Role } from "../models";
import mongoose, { mongo, startSession } from "mongoose";
import { error } from "node:console";

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
        const existingCategory = await ImageCategory.findOne({
          name: name.trim(),
        }).session(session);

        if (existingCategory) {
          // ✅ return แทน throw
          return res.status(400).json({
            message: "Validation error",
            errors: [{ field: "name", message: "Category already exists" }],
          });
        }
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
        const existingCategory = await ImageCategory.findOne({
          name: name.trim(),
          _id: id,
        }).session(session);

        if (existingCategory) {
          // ✅ return แทน throw
          return res.status(400).json({
            message: "Validation error",
            errors: [{ field: "name", message: "Category already exists" }],
          });
        }

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
  static async listRoles(req: Request, res: Response) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const skip = (page - 1) * limit;

      const q = (req.query.search as string)?.trim();

      const filter: any = {};

      if (q) {
        const orConditions: any[] = [
          {
            name: {
              $regex: q,
              $options: "i",
            },
          },
        ];

        if (mongoose.Types.ObjectId.isValid(q)) {
          orConditions.push({
            _id: new mongoose.Types.ObjectId(q),
          });
        }

        filter.$or = orConditions;
      }

      const [roles, total] = await Promise.all([
        Role.find(filter)
          .select("_id name show permissions deletedAt")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        Role.countDocuments(filter),
      ]);

      return res.status(200).json({
        message: "success",
        data: roles,
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
  static async createRole(req: Request, res: Response) {
    const session = await startSession();
    try {
      const { name, permissions } = req.body;
      let createdRole;

      await session.withTransaction(async () => {
        const existingRole = await Role.findOne({ name: name.trim() }).session(
          session,
        );

        if (existingRole) {
          // ✅ return แทน throw
          return res.status(400).json({
            message: "Validation error",
            errors: [{ field: "name", message: "Role already exists" }],
          });
        }

        const role = new Role({ name: name.trim(), permissions });
        createdRole = await role.save({ session });
      });

      return res.status(201).json({
        message: "Role created successfully",
        data: createdRole,
      });
    } catch (error: unknown) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    } finally {
      await session.endSession();
    }
  }
  static async updateRole(req: Request, res: Response) {
    const id = req.params.id;
    const session = await startSession();

    try {
      const { name, permissions } = req.body;

      const parsePermissions = (permissions: unknown): string[] => {
        if (Array.isArray(permissions)) {
          return permissions.filter((p): p is string => typeof p === "string");
        }
        if (typeof permissions === "string") {
          try {
            const parsed = JSON.parse(permissions);
            if (Array.isArray(parsed))
              return parsed.filter((p): p is string => typeof p === "string");
          } catch {}
          return permissions
            .replace(/'/g, "")
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
        }
        return [];
      };

      // ✅ validate name
      if (!name || typeof name !== "string") {
        return res.status(400).json({
          message: "Validation error",
          errors: [{ field: "name", message: "Name is required" }],
        });
      }

      const parsedPermissions = parsePermissions(permissions);
      let updatedRole;

      await session.withTransaction(async () => {
        const role = await Role.findById(id).session(session);

        // ✅ ไม่พบ role
        if (!role) {
          return res.status(404).json({ message: "Role not found" });
        }

        // ✅ ชื่อซ้ำ
        const existingRole = await Role.findOne({
          name: name.trim(),
          _id: { $ne: id },
        }).session(session);

        if (existingRole) {
          return res.status(400).json({
            message: "Validation error",
            errors: [{ field: "name", message: "Role name already exists" }],
          });
        }

        role.name = name.trim();
        role.permissions = parsedPermissions;
        updatedRole = await role.save({ session });
      });

      return res.status(200).json({
        message: "Role updated successfully",
        data: updatedRole,
      });
    } catch (error: unknown) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    } finally {
      await session.endSession();
    }
  }
  static async deleteRole(req: Request, res: Response) {
    const id = req.params.id;

    const session = await startSession();

    try {
      let updatedRole: any;

      await session.withTransaction(async () => {
        const role = await Role.findById(id).session(session);

        if (!role) {
          throw {
            field: "other",
            message: "Role not found",
          };
        }

        // ✅ toggle delete / restore
        role.deletedAt = role.deletedAt ? null : new Date();

        updatedRole = await role.save({
          session,
        });
      });

      return res.status(200).json({
        message: updatedRole?.deletedAt
          ? "Role deleted successfully"
          : "Role restored successfully",

        data: updatedRole,
      });
    } catch (error: any) {
      return res.status(500).json({
        field: error.field || "other",

        message: error.message || "Internal server error",
      });
    } finally {
      await session.endSession();
    }
  }

  static async toggleRole(req: Request, res: Response) {
    const id = req.params.id;

    const session = await startSession();

    try {
      let updatedUserRole;

      await session.withTransaction(async () => {
        const { show } = req.body;
        const result = await Role.findById(id).session(session);

        if (!result) {
          throw {
            field: "other",
            message: "User role not found",
          };
        }
        result.show = show;

        updatedUserRole = await result.save({ session });
      });

      return res.status(200).json({
        message: "User role updated successfully",

        data: updatedUserRole,
      });
    } catch (err: unknown) {
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      await session.endSession();
    }
  }
  static async listRolesShow(req: Request, res: Response) {
    try {
      const roles = await Role.find({ deletedAt: null })
        .select("_id name show") // ✅ เลือก field ที่ต้องการ
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        message: "Roles fetched successfully",
        data: roles,
      });
    } catch (err: unknown) {
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
  static async listPermissions(req: Request, res: Response) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const skip = (page - 1) * limit;

      // ✅ search
      const q = (req.query.search as string)?.trim();
      const tags = (req.query.tags as string)?.split(",");
      const filter: any = {};
      if (q) {
        const orConditions: any[] = [
          // { resource: { $regex: q, $options: "i" } },
        ];

        // 🔥 ถ้า q เป็น ObjectId
        if (mongoose.Types.ObjectId.isValid(q)) {
          orConditions.push({ _id: new mongoose.Types.ObjectId(q) });
        }

        filter.$or = orConditions;
      }
      const [usersRole, totalData] = await Promise.all([
        HasRole.aggregate([
          {
            $match: filter,
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
          // ✅ group roles by user
          {
            $group: {
              _id: "$user_id",

              roles: {
                $push: {
                  // resource: "$resource",
                  role_id: "$role_id",
                },
              },

              createdAt: {
                $first: "$createdAt",
              },
            },
          },
          // ✅ user lookup
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: "$user",
          },
          // ✅ role lookup
          {
            $lookup: {
              from: "roles",
              localField: "roles.role_id",
              foreignField: "_id",
              as: "rolesData",
            },
          },
          // ✅ map role names
          {
            $addFields: {
              roles: {
                $map: {
                  input: "$rolesData",
                  as: "role",

                  in: {
                    _id: "$$role._id",

                    name: "$$role.name",

                    permissions: "$$role.permissions",
                  },
                },
              },
            },
          },
          // ✅ project fields
          {
            $project: {
              _id: 1,
              createdAt: 1,
              // "user._id": 1,
              "user.name": 1,
              "user.email": 1,
              "user.mobile": 1,
              roles: 1,
            },
          },
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ]),

        // ✅ total users
        HasRole.aggregate([
          {
            $match: filter,
          },
          {
            $group: {
              _id: "$user_id",
            },
          },
          {
            $count: "total",
          },
        ]),
      ]);

      const total = totalData.length;
      return res.status(200).json({
        message: "success",
        data: usersRole,
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
  static async createPermission(req: Request, res: Response) {
    const { roles } = req.body;
    const userId = req.user?.userId;
    const session = await mongoose.startSession();
    try {
      let data;
      await session.withTransaction(async () => {
        for (const role of roles) {
          const result = await HasRole.findOne({
            user_id: userId,
            role_id: role,
          }).session(session);

          if (!result) {
            // ถ้าไม่เจอ → insert ใหม่
            await HasRole.create([{ user_id: userId, role_id: role }], {
              session,
            });
          }
        }
      });
      return res.status(200).json({
        message: "Permissions create successfully",

        data,
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
  static async updatePermission(req: Request, res: Response) {
    const { roles } = req.body;

    const userId = req.params.id;

    const session = await mongoose.startSession();

    try {
      let data;

      await session.withTransaction(async () => {
        // ✅ remove old roles
        await HasRole.deleteMany(
          {
            user_id: new mongoose.Types.ObjectId(userId as string),
          },
          { session },
        );

        // ✅ create new roles
        if (Array.isArray(roles) && roles.length > 0) {
          await HasRole.insertMany(
            roles.map((roleId: string) => ({
              user_id: new mongoose.Types.ObjectId(userId as string),

              role_id: new mongoose.Types.ObjectId(roleId),
            })),
            { session },
          );
        }

        // ✅ get latest data
        data = await HasRole.find({
          user_id: new mongoose.Types.ObjectId(userId as string),
        })
          .populate("role_id", "name")
          .session(session);
      });

      return res.status(200).json({
        message: "Permissions updated successfully",

        data,
      });
    } catch (err: unknown) {
      return res.status(500).json({
        message: "Server error",

        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      await session.endSession();
    }
  }

  static async deletePermission(req: Request, res: Response) {
    const id = req.params.id;
    const session = await mongoose.startSession();

    try {
      let deletedPermission;

      await session.withTransaction(async () => {
        const result = await HasRole.findById(id).session(session);
        if (!result) {
          throw new Error("Permission not found");
        }

        // ✅ ลบด้วย await
        deletedPermission = await result.deleteOne({ session });
      });

      return res.status(200).json({
        message: "Permission deleted successfully",
        data: deletedPermission,
      });
    } catch (err: unknown) {
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      await session.endSession();
    }
  }

  static async createUser(req: Request, res: Response) {}
  static async listUsers(req: Request, res: Response) {}
  static async getUserById(req: Request, res: Response) {}
  static async updateUser(req: Request, res: Response) {}
}
export default AdminController;
