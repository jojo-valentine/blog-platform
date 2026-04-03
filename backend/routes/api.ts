import express, { Router, Request, Response } from "express";
import authRouter from "./auth";
import otpRouter from "./otp";
  
const router = Router();

router.get("/hello", (req: Request, res: Response) => {
  res.send("👋 Hello from API v1!");
});

router.use("/auth", authRouter);
router.use("/otp", otpRouter);

export default router;
