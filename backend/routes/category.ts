import { Router, Request, Response } from "express";
import otpController from "../controllers/OtpController";
import { authMiddleware } from "../middleware/authMiddleware";
import CategoryController from "../controllers/CategoryController";

const router = Router();
router.get(
  "/image-category",
  authMiddleware,
  CategoryController.listImageCategory,
);
export default router;
