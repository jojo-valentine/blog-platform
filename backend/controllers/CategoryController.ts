import { Request, Response } from "express";
import { ImageCategory } from "../models";

class CategoryController {
  static listImageCategory = async (req: Request, res: Response) => {
    try {
      const categories = await ImageCategory.find().select("name _id"); // ✅ ถูก

      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      console.error("❌ listImageCategory error:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };
}

export default CategoryController;
