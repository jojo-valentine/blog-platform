import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { HasRole } from "../models";
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.accessToken;
  // console.log({ token: req.cookies });

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const errors = [];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    console.log("decoded:", decoded);

    // ดึง roles + permissions ของ user จาก DB
    const hasRoles = await HasRole.find({ user_id: decoded.id }).populate<{
      role_id: { name: string; permissions: string[] };
    }>("role_id", "name permissions");

    const roles = hasRoles.map((hr) => hr.role_id.name);
    const permissions = [
      ...new Set(hasRoles.flatMap((hr) => hr.role_id.permissions)),
    ];

    req.user = { userId: decoded.id, roles, permissions };

    next();
  } catch (error: any) {
    if (error.status === 401) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    } else {
      return res.status(500).json({
        message: "someeting went wrong",
        error,
      });
    }
  }
};
