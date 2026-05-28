import { Router, Request, Response } from "express";
import AdminController from "../controllers/AdminController";
import { requirePermission, requireRole } from "../middleware/roleMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
import { useValidation } from "../middleware/useValidation";
import { categorySchemas } from "../validations/categoryValidation";
import { adminSchemas, adminSchemasUser } from "../validations/adminValidation";
import {
  uploadAvatar,
  uploadAvatarAdmin,
} from "../middleware/uploadMiddleware";
import { generateUserId } from "../services/generateId ";
import multer from "multer";
const upload = multer();
const router = Router();

router.get("test", (req: Request, res: Response) => {
  res.status(200).json({
    message: "success test admin router",
  });
});

router.get(
  "/list/blogs",
  authMiddleware,
  requireRole("admin"),
  requirePermission("view_blog"),
  AdminController.listBlog,
);

router.patch(
  "/:id/blogs/suspension",
  authMiddleware,
  requireRole("admin"),
  requirePermission("blog_suspension"),
  AdminController.toggleBlogPostSuspension,
);

router.get(
  "/list/categories",
  authMiddleware,
  requireRole("admin"),
  AdminController.listCategory,
);

router.post(
  "/list/categories/create",
  authMiddleware,
  requireRole("admin"),
  useValidation({ body: categorySchemas.create }),
  AdminController.storeCategory,
);

router.patch(
  "/list/categories/:id/update",
  authMiddleware,
  requireRole("admin"),
  useValidation({ body: categorySchemas.update }),
  AdminController.updateCategory,
);
router.delete(
  "/list/categories/:id/delete",
  authMiddleware,
  requireRole("admin"),
  AdminController.deleteCategory,
); // soft delete
router.delete(
  "/:id/destroy",
  authMiddleware,
  requireRole("admin"),
  AdminController.destroyCategory,
); // hard delete

// ดึงรายการ role ทั้งหมด
router.get(
  "/roles",
  authMiddleware,
  requireRole("admin"),
  AdminController.listRoles,
);

// สร้าง role ใหม่
router.post(
  "/roles",
  authMiddleware,
  requireRole("admin"),
  AdminController.createRole,
);

// อัปเดต role ตาม id
router.patch(
  "/roles/:id/update",
  authMiddleware,
  requireRole("admin"),
  useValidation({ body: adminSchemas.update }),
  AdminController.updateRole,
);

// ลบ role ตาม id
router.patch(
  "/roles/:id/delete",
  authMiddleware,
  requireRole("admin"),
  AdminController.deleteRole,
);

router.patch(
  "/roles/:id/show",
  authMiddleware,
  requireRole("admin"),
  AdminController.toggleRole,
);
router.get(
  "/roles/list",
  authMiddleware,
  requireRole("admin"),
  AdminController.listRoles,
);

// pomision
router.post(
  "/permissions",
  authMiddleware,
  requireRole("admin"),
  AdminController.createPermission,
);

router.get(
  "/permissions",
  authMiddleware,
  requireRole("admin"),
  AdminController.listPermissions,
);

router.patch(
  "/permissions/:id",
  authMiddleware,
  requireRole("admin"),
  AdminController.updatePermission,
);

router.delete(
  "/permissions/:id",
  authMiddleware,
  requireRole("admin"),
  AdminController.deletePermission,
);

router.get("/list/user", AdminController.listUsersPermission);
// user
router.post(
  "/users/:id/avatar", // ✅ ระบุ user id ใน params
  authMiddleware,
  uploadAvatarAdmin,
  requireRole("admin"),
  AdminController.uploadAvatarByAdmin,
);
router.post(
  "/users",
  authMiddleware,
  generateUserId,
  uploadAvatarAdmin,
  requireRole("admin"),
  useValidation({ body: adminSchemasUser.create }),
  AdminController.createUser,
);

router.get("/users", AdminController.listUsers);

router.patch(
  "/users/:id",
  authMiddleware,
  requireRole("admin"),
  useValidation({ body: adminSchemasUser.update }),
  AdminController.updateUser,
);
router.patch(
  "/users/:id/suspension",
  authMiddleware,
  requireRole("admin"),
  AdminController.toggleUserSuspension,
);
router.patch(
  "/users/:id/changePassword",
  authMiddleware,
  requireRole("admin"),
  requirePermission("update_user"),
  useValidation({ body: adminSchemasUser.changPassword }),
  AdminController.changePasswordUser,
);

router.get(
  "/user/account",
  authMiddleware,
  requireRole("admin"),
  AdminController.getDataAdmin,
);
router.patch(
  "/user/:id/account",
  authMiddleware,
  uploadAvatarAdmin,
  requireRole("admin"),
  useValidation({ body: adminSchemasUser.updateAdminUser }),
  AdminController.updateDataAdmin,
);

export default router;
