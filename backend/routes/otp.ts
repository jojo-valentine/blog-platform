import { Router, Request, Response } from "express";
import otpController from "../controllers/OtpController";

const router = Router();
router.post("/resend-otp/", otpController.otpsent);
export default router;
