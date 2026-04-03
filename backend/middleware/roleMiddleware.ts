import { Request, Response, NextFunction } from "express";

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
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const hasRole = req.user?.roles.some((r) => roles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
};
// เช็ค permission
export const requirePermission = (...permission: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const hasPermission = permission.every((p) =>
      req.user?.permissions.includes(p),
    );
    if (!hasPermission) {
      return res
        .status(403)
        .json({ message: "Forbiddden insufficent perminsion" });
    }
    next();
  };
};
