import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import BlogController from "../controllers/BlogController";
import { useValidation } from "../middleware/useValidation";
import { blogSchemas } from "../validations/blogValidate";
import { checkMaxBlogImages, uploadBlog } from "../middleware/uploadMiddleware";
import { generateBlogId } from "../services/generateId ";
const router = Router();
import multer from "multer";
import { requireRole } from "../middleware/roleMiddleware";
const upload = multer();
router.get("/data-list", authMiddleware, BlogController.blogDataList);
router.post(
  "/create",
  authMiddleware,
  requireRole("admin", "blogger"),
  generateBlogId,
  uploadBlog,
  useValidation({ body: blogSchemas.create }),
  BlogController.blogCreate,
);
// router.post("/create", upload.any(), (req, res) => {
//   console.log(req.body);  // text fields
//   console.log(req.files); // binary files
//   res.json({ body: req.body, files: req.files });
// });

router.get(
  "/:id/edit",
  authMiddleware,
  requireRole("admin", "blogger"),
  BlogController.blogEdit,
);
router.delete(
  "/:id/image",
  authMiddleware,
  requireRole("admin", "blogger"),
  BlogController.blogDeleteImage,
);
router.patch(
  "/:id/update",
  authMiddleware,
  requireRole("admin", "blogger"),
  uploadBlog,
  checkMaxBlogImages,
  useValidation({ body: blogSchemas.update }),
  BlogController.blogUpdate,
);
router.patch(
  "/:id/toggle",
  authMiddleware,
  requireRole("admin", "blogger"),
  useValidation({ body: blogSchemas.toggleBlog }),
  BlogController.blogTogglePost,
);
router.delete(
  "/:id/delete",
  authMiddleware,
  requireRole("admin", "blogger"),
  BlogController.blogDeletePost,
);

router.get("/home", BlogController.blogHome);
router.get("/public", BlogController.blogPublicList);
router.get("/:id/detail", BlogController.blogDetail);
router.get("/profile/list/:id/post", BlogController.profileBlogger);
export default router;
