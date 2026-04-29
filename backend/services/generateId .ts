import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
export const generateBlogId = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (req as any).blogId = new mongoose.Types.ObjectId();
  next();
};
  