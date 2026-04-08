import { Router, Request, Response } from "express";
import AdminController from "../controllers/AdminController";
import { requirePermission, requireRole } from "../middleware/roleMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
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

export default router;
