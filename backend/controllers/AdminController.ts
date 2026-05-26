import { Request, Response } from "express";
import {
  Blog,
  HasRole,
  ImageBlog,
  ImageCategory,
  Profile,
  Role,
  User,
} from "../models";
import mongoose, { mongo, startSession } from "mongoose";
import { error } from "node:console";
import path from "path";
import { endsWith } from "zod";
const fs = require("fs");

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

      const q = (req.query.search as string)?.trim();

      // ✅ category query
      const categoryRaw = req.query.category || req.query["category[]"];

      const category = Array.isArray(categoryRaw)
        ? categoryRaw
        : typeof categoryRaw === "string"
          ? categoryRaw.split(",")
          : [];

      // ✅ validate ObjectId
      const validCategoryIds = category
        .filter(
          (id): id is string =>
            typeof id === "string" && mongoose.Types.ObjectId.isValid(id),
        )
        .map((id) => new mongoose.Types.ObjectId(id));

      // ✅ pre filter
      const preFilter: any = {};

      // ✅ search by object id
      if (q && mongoose.Types.ObjectId.isValid(q)) {
        preFilter.$or = [
          {
            user_id: new mongoose.Types.ObjectId(q),
          },
          {
            role_id: new mongoose.Types.ObjectId(q),
          },
        ];
      }

      // ✅ search name/email after lookup
      const postMatch =
        q && !mongoose.Types.ObjectId.isValid(q)
          ? [
              {
                $match: {
                  $or: [
                    {
                      "user.name": {
                        $regex: q,
                        $options: "i",
                      },
                    },
                    {
                      "user.email": {
                        $regex: q,
                        $options: "i",
                      },
                    },
                  ],
                },
              },
            ]
          : [];

      const pipeline: any[] = [
        // ✅ match before group
        {
          $match: {
            ...preFilter,
            deletedAt: null,
          },
        },

        // ✅ group by user
        {
          $group: {
            _id: "$user_id",

            roles: {
              $addToSet: "$role_id",
            },

            createdAt: {
              $first: "$createdAt",
            },
          },
        },

        // ✅ filter AFTER group
        ...(validCategoryIds.length > 0
          ? [
              {
                $match: {
                  roles: {
                    $in: validCategoryIds,
                  },
                },
              },
            ]
          : []),

        // ✅ sort
        {
          $sort: {
            createdAt: -1,
          },
        },

        // ✅ lookup user
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

        // ✅ search name/email
        ...postMatch,

        // ✅ lookup roles
        {
          $lookup: {
            from: "roles",
            localField: "roles",
            foreignField: "_id",
            as: "rolesData",
          },
        },

        // ✅ map roles
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

                  deletedAt: "$$role.deletedAt",
                },
              },
            },
          },
        },

        // ✅ project
        {
          $project: {
            _id: 1,

            createdAt: 1,

            "user._id": 1,
            "user.name": 1,
            "user.email": 1,
            "user.mobile": 1,

            roles: 1,
          },
        },
      ];

      const [usersRole, totalData] = await Promise.all([
        HasRole.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),

        HasRole.aggregate([
          ...pipeline,
          {
            $count: "total",
          },
        ]),
      ]);

      const total = totalData[0]?.total || 0;

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
    const { roles, user_id } = req.body;
    const session = await mongoose.startSession();

    const errors: { field: string; message: string }[] = [];

    // ✅ validate user id
    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
      errors.push({
        field: "user_id",
        message: "Invalid user id",
      });
    }

    // ✅ validate roles
    if (!Array.isArray(roles) || roles.length === 0) {
      errors.push({
        field: "roles",
        message: "At least one role is required",
      });
    } else {
      const invalidRoles = roles.filter(
        (role) => !mongoose.Types.ObjectId.isValid(role),
      );

      if (invalidRoles.length > 0) {
        errors.push({
          field: "roles",
          message: "One or more role IDs are invalid",
        });
      }
    }

    // ✅ return validation errors
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation error",
        errors,
      });
    }
    try {
      let data: any[] = [];

      await session.withTransaction(async () => {
        const toInsert = [];

        for (const role of roles) {
          const exists = await HasRole.findOne({
            user_id: new mongoose.Types.ObjectId(user_id),
            role_id: new mongoose.Types.ObjectId(role),
          }).session(session);

          if (!exists) {
            toInsert.push({ user_id, role_id: role });
          }
        }

        if (toInsert.length > 0) {
          await HasRole.insertMany(toInsert, { session });
        }

        data = await HasRole.find({
          user_id: new mongoose.Types.ObjectId(user_id),
        })
          .populate("role_id", "name")
          .populate({
            path: "user_id",
            select: "name email ",
            populate: {
              path: "profile",

              select: "user_id display_name",
            },
          })
          .session(session);
      });
      const formatted = {
        _id: user_id,
        user: data[0]?.user_id,
        roles: data.map((item: any) => ({
          _id: item.role_id?._id,
          name: item.role_id?.name,
        })),
        createdAt: data[0]?.createdAt,
        updatedAt: data[0]?.updatedAt,
      };

      return res.status(201).json({
        message: "Permissions created successfully",
        data: formatted,
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
    const userId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const session = await mongoose.startSession();
    const errors: { field: string; message: string }[] = [];
    // ✅ validate user id
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      errors.push({
        field: "roles",
        message: "Invalid user id",
      });
    }

    // ✅ validate roles
    if (!Array.isArray(roles) || roles.length === 0) {
      errors.push({
        field: "roles",
        message: "At least one role is required",
      });
    } else {
      const invalidRoles = roles.filter(
        (role) => !mongoose.Types.ObjectId.isValid(role),
      );

      if (invalidRoles.length > 0) {
        errors.push({
          field: "roles",
          message: "One or more role IDs are invalid",
        });
      }
    }

    // ✅ return validation errors
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation error",
        errors,
      });
    }
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

  static async listUsersPermission(req: Request, res: Response) {
    try {
      const data = await User.find(
        {},
        {
          name: 1,
          email: 1,
        },
      )
        .populate({
          path: "profile",
          select: "user_id display_name",
        })
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        message: "success",
        data,
      });
    } catch (err: unknown) {
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
  static async deletePermission(req: Request, res: Response) {
    const user_id = req.params.id as string;
    const session = await mongoose.startSession();

    try {
      // ✅ validate id
      if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({
          message: "Invalid user id",
        });
      }

      let deletedPermissions;

      await session.withTransaction(async () => {
        // ✅ หา permissions ทั้งหมดของ user
        const permissions = await HasRole.find({
          user_id: new mongoose.Types.ObjectId(user_id),

          deletedAt: null,
        }).session(session);

        if (permissions.length === 0) {
          throw new Error("Permission not found");
        }

        // ✅ soft delete ทั้งหมด
        deletedPermissions = await HasRole.updateMany(
          {
            user_id: new mongoose.Types.ObjectId(user_id),
          },

          {
            $set: {
              deletedAt: new Date(),
            },
          },

          { session },
        );
      });

      return res.status(200).json({
        message: "Permissions deleted successfully",

        data: deletedPermissions,
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

  static async createUser(req: Request, res: Response) {
    const session = await mongoose.startSession();

    // ✅ rollback file helper
    const rollbackFile = () => {
      try {
        if (req.file?.path) {
          const fullPath = path.join(__dirname, `../../${req.file.path}`);

          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);

            console.log("🗑 rollback avatar:", fullPath);
          }
        }
      } catch (fileErr) {
        console.error("rollback file error:", fileErr);
      }
    };

    try {
      const { name, email, mobile, password, display_name, age, social_links } =
        req.body;
      const errors: { field: string; message: string }[] = [];
      const existingUser = await User.findOne({
        $or: [{ email }, { mobile }, { name }],
      });

      const existingProfile = await Profile.findOne({
        display_name,
      });

      if (existingUser || existingProfile) {
        const errors: { field: string; message: string }[] = [];

        // user
        if (existingUser?.email === email) {
          errors.push({
            field: "email",
            message: "Email already exists",
          });
        }

        if (existingUser?.mobile === mobile) {
          errors.push({
            field: "mobile",
            message: "Mobile already exists",
          });
        }

        if (existingUser?.name === name) {
          errors.push({
            field: "name",
            message: "Name already exists",
          });
        }

        // profile
        if (existingProfile?.display_name === display_name) {
          errors.push({
            field: "display_name",
            message: "Display name already exists",
          });
        }

        return res.status(400).json({
          message: "Validation error",
          errors,
        });
      }
      // ✅ generated id
      const userId =
        (req as any).userId?.toString() ||
        new mongoose.Types.ObjectId().toString();

      // ✅ relative path from middleware
      const avatar = req.file?.path || "";
      let data: any = null;

      await session.withTransaction(async () => {
        // ✅ create user
        const user = await User.create(
          [
            {
              _id: userId,
              name,
              email,
              mobile,
              password,
            },
          ],
          { session },
        );

        // ✅ create profile
        const profile = await Profile.create(
          [
            {
              user_id: userId,
              display_name: display_name || name,
              age: age || "",
              avatar,
              social_links: social_links || [],
            },
          ],
          { session },
        );

        data = {
          _id: userId,
          name,
          email,
          mobile,
          profile: {
            display_name: profile[0].display_name,
            age: profile[0].age,
            avatar: profile[0].avatar,
            social_links: profile[0].social_links,
          },
        };
      });

      return res.status(201).json({
        message: "user create successfully",
        data,
      });
    } catch (err: unknown) {
      // ✅ rollback uploaded file
      rollbackFile();

      console.error(err);

      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      await session.endSession();
    }
  }
  static async listUsers(req: Request, res: Response) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const skip = (page - 1) * limit;
      const q = (req.query.search as string)?.trim();

      // ✅ ดึง admin ids
      const adminRole = await Role.findOne({ name: "admin" }).lean();
      const adminUserIds = adminRole
        ? (
            await HasRole.find({
              role_id: adminRole._id,

              deletedAt: null,
            }).distinct("user_id")
          ).map((id) => new mongoose.Types.ObjectId(String(id)))
        : [];

      const filter: any = {
        deletedAt: null,
        _id: { $nin: adminUserIds },
      };

      // ✅ search
      if (q) {
        const matchedProfiles = await Profile.find({
          deletedAt: null,
          display_name: {
            $regex: q,
            $options: "i",
          },
        }).distinct("user_id");

        filter.$or = [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { mobile: { $regex: q, $options: "i" } },
          { _id: { $in: matchedProfiles } },
          ...(mongoose.Types.ObjectId.isValid(q)
            ? [{ _id: new mongoose.Types.ObjectId(q) }]
            : []),
        ];
      }

      const [users, total] = await Promise.all([
        User.find(filter)
          .select("name email mobile createdAt")
          .populate({
            path: "profile",
            match: {
              deletedAt: null,
            },
            select: "display_name age avatar social_links",
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(), // ✅ แก้ตรงนี้
        User.countDocuments(filter),
      ]);

      return res.status(200).json({
        message: "success users",
        data: users,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err: unknown) {
      return res.status(500).json({
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
  static async getUserById(req: Request, res: Response) {}

  static async uploadAvatarByAdmin(req: Request, res: Response) {
    const targetUserId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id; // ✅ ใช้ id จาก params
    console.log({ targetUserId });

    // ✅ validate id
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const file = req.file as Express.Multer.File;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const session = await mongoose.startSession();
    let oldAvatar = "";

    try {
      let profileData: any;

      await session.withTransaction(async () => {
        const profile = await Profile.findOne({
          user_id: targetUserId, // ✅ ใช้ targetUserId แทน req.user?.userId
        }).session(session);

        if (!profile) throw new Error("Profile not found");

        oldAvatar = profile.avatar || "";
        profile.avatar = file.path;
        await profile.save({ session });
        profileData = profile;
      });

      // ลบรูปเก่า
      if (oldAvatar) {
        const absolute = path.resolve(process.cwd(), "." + oldAvatar);
        try {
          if (fs.existsSync(absolute) && fs.lstatSync(absolute).isFile()) {
            await fs.promises.unlink(absolute);
          }
        } catch (err) {
          console.error("Delete old avatar error:", err);
        }
      }

      return res.status(200).json({
        avatarUrl: profileData?.avatar,
        message: "update avatar successfully",
      });
    } catch (error: unknown) {
      // ลบไฟล์ใหม่ถ้า error
      try {
        if (file?.path) {
          const absolute = path.resolve(file.path);
          if (fs.existsSync(absolute)) await fs.promises.unlink(absolute);
        }
      } catch {}

      return res.status(500).json({
        message: error instanceof Error ? error.message : "Server error",
      });
    } finally {
      await session.endSession();
    }
  }

  static async updateUser(req: Request, res: Response) {
    const session = await mongoose.startSession();

    try {
      const idParam = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const { name, mobile, email, profile } = req.body;

      // ✅ validate id
      if (!mongoose.Types.ObjectId.isValid(idParam)) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      let result: any = null;

      await session.withTransaction(async () => {
        // ✅ หา user
        const user = await User.findById(idParam).session(session);
        if (!user) {
          throw new Error("User not found");
        }

        // ✅ หา profile
        let profileUser = await Profile.findOne({ user_id: idParam }).session(
          session,
        );

        // ✅ create profile ถ้ายังไม่มี
        if (!profileUser) {
          profileUser = await Profile.create(
            [{ user_id: idParam, display_name: user.name }],
            {
              session,
            },
          ).then((res) => res[0]);
        }

        // ✅ update user
        await User.updateOne(
          { _id: idParam },
          { $set: { name, mobile, email } },
          { session },
        );

        // ✅ update profile
        const updatedProfile = await Profile.findOneAndUpdate(
          { user_id: idParam },
          {
            $set: {
              display_name: profile?.display_name ?? "",
              age: profile?.age ?? "",
              avatar: profile?.avatar ?? "",
              social_links:
                profile?.social_links ?? profileUser?.social_links ?? [],
            },
          },
          { new: true, session },
        );

        result = {
          _id: user._id,
          name,
          mobile,
          email,
          profile: {
            display_name: updatedProfile?.display_name,
            age: updatedProfile?.age,
            avatar: updatedProfile?.avatar,
            social_links: updatedProfile?.social_links,
          },
        };
      });

      // ✅ return success
      return res.status(200).json({
        message: "Update successfully",
        data: result,
      });
    } catch (error: unknown) {
      console.error("🔥 updateUser ERROR =>", error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Server error",
      });
    } finally {
      await session.endSession();
    }
  }
}
export default AdminController;
