import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import BlogController from "../controllers/BlogController";
import { useValidation } from "../middleware/useValidation";
import { blogSchemas } from "../validations/blogValidate";
import { uploadBlog } from "../middleware/uploadMiddleware";
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
export default router;
