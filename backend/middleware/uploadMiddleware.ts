import multer, { FileFilterCallback } from "multer";
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const sharp = require("sharp");
import { Request, Response, NextFunction, response } from "express";
import { error } from "node:console";
import { file } from "zod";
import { ImageBlog } from "../models";

const uploadDir = path.join(__dirname, "../../update");
const uploadDirPost = path.join(__dirname, "../../update/post");
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        roles: string[];
        permissions: string[];
      };
      multerError?: {
        type: "multer" | "sharp" | "unknown";
        message: string;
        field?: string;
      };
    }
  }
}
function ensureDir(dir: string): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
// --- ใช้ memoryStorage ก่อน แล้วแปลงด้วย sharp ---
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    // console.log("🔵 mimetype:", file.mimetype); // ← เพิ่มตรงนี้
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});
const createUploadMiddleware =
  (fieldName: string, getTargetDir: (req: Request) => string) =>
  (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        req.multerError = {
          type: err instanceof multer.MulterError ? "multer" : "unknown",
          message: err.message,
        };
        return next();
      }

      if (!req.file || !req.file.buffer) return next();

      try {
        const userId = req.user?.userId;
        if (!userId) throw new Error("Unauthorized");

        const filename = `${Date.now()}-${uuidv4()}.jpg`;
        const targetDir = getTargetDir(req);

        // ensure dir exists
        fs.mkdirSync(targetDir, { recursive: true });

        const outputPath = path.join(targetDir, filename);

        await sharp(req.file.buffer).jpeg({ quality: 90 }).toFile(outputPath);

        // relative path สำหรับ DB/frontend
        const relativePath = `/upload/${userId}/avatar/${filename}`;

        req.file.filename = filename;
        req.file.path = relativePath;
        (req.file as any).fullPath = outputPath; // absolute path สำหรับจัดการไฟล์จริง

        // console.log({ relativePath });
        return next();
      } catch (sharpError: any) {
        if (sharpError?.message === "Unauthorized") {
          return res.status(401).json({ message: "Unauthorized" });
        }
        req.multerError = {
          type: "sharp",
          message: sharpError?.message || "Image processing error",
        };
        return next();
      }
    });
  };

const createUploadMultipleMiddleware =
  (
    fieldName: string,
    maxCount: number,
    getTargetDir: (req: Request) => string,
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    upload.array(fieldName, maxCount)(req, res, async (err: any) => {
      if (err) {
        req.multerError = {
          type: err instanceof multer.MulterError ? "multer" : "unknown",
          message: err.message,
        };
        return next();
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return next();

      try {
        const targetDir = getTargetDir(req);
        const processedFiles: Express.Multer.File[] = [];
        for (const file of files) {
          const filename = `${Date.now()}-${uuidv4()}.jpg`;
          const outputPath = path.join(ensureDir(targetDir), filename);
          await sharp(file.buffer).jpeg({ quality: 90 }).toFile(outputPath);

          processedFiles.push({ ...file, filename, path: outputPath });
        }

        req.files = processedFiles;
        return next();
      } catch (sharpError: any) {
        if (sharpError?.message === "Unauthorized") {
          return res.status(401).json({ message: "Unauthorized" });
        }
        req.multerError = {
          type: "sharp",
          message: sharpError?.message || "Image processing error",
        };
        return next();
      }
    });
  };

export const uploadAvatar = createUploadMiddleware("avatar", (req) => {
  const userId = req.user?.userId;
  if (!userId) throw new Error("Unauthorized");
  return path.join(__dirname, `../upload/${userId}/avatar`);
});
// รูป cover หลักของ blog
export const uploadBlogCover = createUploadMiddleware("coverImage", (req) => {
  const userId = req.user?.userId;
  if (!userId) throw new Error("Unauthorized");

  return path.join(__dirname, `../upload/${userId}/blog/cover`);
});
const MAX_BLOG_IMAGES = parseInt(process.env.MAX_BLOG_IMAGES || "5");

// รูปประกอบใน blog (หลายรูป)
// export const uploadBlogImage = createUploadMultipleMiddleware(
//   "image",
//   MAX_BLOG_IMAGES,
//   (req) => {
//     const userId = req.user?.userId;
//     if (!userId) throw new Error("Unauthorized");

//     return path.join(__dirname, `../upload/${userId}/blog/images`);
//   },
// );

const uploadBlogFields = upload.fields([
  {
    name: "coverImage",
    maxCount: 1,
  },
  {
    name: "image",
    maxCount: MAX_BLOG_IMAGES,
  },
]);
export const uploadBlog = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  if (!userId) throw new Error("Unauthorized");
  uploadBlogFields(req as any, res, async (err: any) => {
    if (err) {
      req.multerError = {
        type: err instanceof multer.MulterError ? "multer" : "unknown",
        field: err.field || "unknown", // 🔥 เพิ่มตรงนี้
        message: err.message,
      };
      return next();
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files) {
      return next();
    }

    try {
      const userId = req.user?.userId;
      if (!userId) res.status(401).json({ message: "Unauthorized" });
      const blogId = (req as any).blogId?.toString() || req.params.id;
      // console.log({ blogId: blogId });

      if (!blogId) {
        return res.status(400).json({ message: "Missing blogId" });
      }
      // process coverImage
      if (files["coverImage"]?.[0]) {
        const cover = files["coverImage"][0];
        const filename = `${Date.now()}-${uuidv4()}.jpg`;
        const targetDir = ensureDir(
          // path.join(__dirname, `../upload/${userId}/blog/${blogId}/cover`),

          path.join(process.cwd(), `upload/${userId}/blog/${blogId}/cover`),
        );
        const outputPath = path.join(targetDir, filename);
        const relativePath = `/upload/${userId}/blog/${blogId}/cover/${filename}`;
        await sharp(cover.buffer).jpeg({ quality: 90 }).toFile(outputPath);
        files["coverImage"][0].filename = filename;
        files["coverImage"][0].path = relativePath;
      }

      // process images
      if (files["image"]?.length) {
        for (const file of files["image"]) {
          const filename = `${Date.now()}-${uuidv4()}.jpg`;
          const targetDir = ensureDir(
            // path.join(__dirname, `../upload/${userId}/blog/${blogId}/images`),
            path.join(process.cwd(), `upload/${userId}/blog/${blogId}/images`),
          );
          const outputPath = path.join(targetDir, filename);
          // 🔥 path สำหรับ save DB (relative)
          const relativePath = `/upload/${userId}/blog/${blogId}/images/${filename}`;
          await sharp(file.buffer).jpeg({ quality: 90 }).toFile(outputPath);
          file.filename = filename;
          file.path = relativePath;
        }
      }
      return next();
    } catch (error: unknown) {
      req.multerError = {
        type: "sharp",
        field: "image-processing",
        message: error instanceof Error ? error.message : "Unknown sharp error",
      };

      return next();
    }
  });
};
export const checkMaxBlogImages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const blogId = req.params.id;
    const userId = req.user?.userId;

    if (!blogId) {
      return res.status(400).json({
        message: "Blog ID is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const files = req.files as {
      coverImage?: Express.Multer.File[];
      image?: Express.Multer.File[];
    };
    const newFilesCount = files?.image?.length || 0;

    const existingCount = await ImageBlog.countDocuments({
      blog_id: blogId,
      deletedAt: null,
    });
    console.log({ existingCount: existingCount, newFilesCount: newFilesCount });

    if (existingCount + newFilesCount > MAX_BLOG_IMAGES) {
      // ✅ ลบไฟล์ที่ upload มาแล้วทิ้ง
      // if (files?.image?.length) {
      //   for (const file of files.image) {
      //     if (file.path && fs.existsSync(file.path)) {
      //       fs.unlinkSync(file.path);
      //     }
      //   }
      // }

      const allFiles = [...(files?.coverImage || []), ...(files?.image || [])];

      allFiles.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });

      req.multerError = {
        type: "sharp",
        field: "image",
        message: `Max ${MAX_BLOG_IMAGES} images allowed`,
      };

      return next(); // 🔥 สำคัญ
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
// ✅ ใช้ fields() รับทั้ง coverImage และ image พร้อมกัน

// const uploadImageMiddleware = createUploadMiddleware("image", uploadDirPost);
