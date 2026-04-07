import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import BlogController from "../controllers/BlogController";
import { useValidation } from "../middleware/useValidation";
import { blogSchemas } from "../validations/blogValidate";
import { checkMaxBlogImages, uploadBlog } from "../middleware/uploadMiddleware";
import { generateBlogId } from "../services/generateId ";
const router = Router();

router.get("/data-list", authMiddleware, BlogController.blogDataList);
router.post(
  "/create",
  authMiddleware,
  generateBlogId,
  uploadBlog,
  useValidation({ body: blogSchemas.create }),
  BlogController.blogCreate,
);
router.get("/:id/edit", authMiddleware, BlogController.blogEdit);
router.delete("/:id/image", authMiddleware, BlogController.blogDeleteImage);
router.patch(
  "/:id/update",
  authMiddleware,
  checkMaxBlogImages,
  uploadBlog,
  useValidation({ body: blogSchemas.update }),
  BlogController.blogUpdate,
);
router.patch(
  "/:id/toggle",
  authMiddleware,
  // useValidation({ body: blogSchemas.toggleBlog }),
  BlogController.blogTogglePost,
);
router.delete("/:id/delete", authMiddleware, BlogController.blogDeletePost);
export default router;
