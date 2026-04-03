import multer, { FileFilterCallback } from "multer";
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const sharp = require("sharp");
import { Request, Response, NextFunction } from "express";
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
        const filename = `${Date.now()}-${uuidv4()}.jpg`;
        // 👉 เอา id จาก req (เช่น req.user.id หรือ req.params.id)
        const targetDir = getTargetDir(req);
        const outputPath = path.join(ensureDir(targetDir), filename);
        await sharp(req.file.buffer)
          // .resize(500, 500, { fit: "cover" })
          .jpeg({ quality: 90 })
          .toFile(outputPath);

        req.file.filename = filename;
        req.file.path = outputPath;

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
  // console.log({ userId: req.user, user: req.user });

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return path.join(__dirname, `../upload/${userId}/avatar`);
});

// const uploadImageMiddleware = createUploadMiddleware("image", uploadDirPost);
