import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
// กำหนด type ว่าจะ validate อะไรได้บ้าง
type ValidateSchema = {
  body?: ZodSchema; // สำหรับ req.body
  params?: ZodSchema; // สำหรับ req.params
  query?: ZodSchema; // สำหรับ req.query
};
// ฟังก์ชันหลัก (รับ schema แล้ว return middleware)
export const useValidation =
  (schema: ValidateSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const sections = ["body", "params", "query"] as const;
    let errors: any[] = [];

    // 1. handle multer error ก่อน
    if (req.multerError) {
      errors.push({
        field: "file",
        message: req.multerError.message,
      });
    }

    // 2. loop เช็คทุก section ก่อน แล้วค่อย return error รวม
    for (const key of sections) {
      const currentSchema = schema[key];
      if (currentSchema) {
        const result = currentSchema.safeParse(req[key]);
        if (!result.success) {
          const zodErrors = result.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          }));
          errors = [...errors, ...zodErrors];
        } else {
          req[key] = result.data; // ✅ clean data
        }
      }
    }

    // 3. รวม error แล้วส่งทีเดียว ✅ อยู่นอก loop
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation error",
        errors,
      });
    }

    next();
  };
