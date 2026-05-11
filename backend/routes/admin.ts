import { Router, Request, Response } from "express";
import AdminController from "../controllers/AdminController";
import { requirePermission, requireRole } from "../middleware/roleMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
import { useValidation } from "../middleware/useValidation";
import { categorySchemas } from "../validations/categoryValidation";
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
  requirePermission("blog_view"),
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

export default router;
