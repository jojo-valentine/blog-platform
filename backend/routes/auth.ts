import { Router, Request, Response } from "express";
import AuthController from "../controllers/AuthController";
import { useValidation } from "../middleware/useValidation";
import { authSchemas } from "../validations/authValidation";
import { authMiddleware } from "../middleware/authMiddleware";
import UserController from "../controllers/UserController";
import { uploadAvatar } from "../middleware/uploadMiddleware";
import { profileSchemas } from "../validations/profileValidation";
const router = Router();
// router.get("/", (req: Request, res: Response) => {
//   res.send("Auth route working");
// });
router.get("/", (req, res) => {
  res.send("🔥 NEW AUTH ROUTE");
});
router.post(
  "/register/",
  useValidation({ body: authSchemas.register }),
  AuthController.register,
);
router.post(
  "/login/",
  useValidation({ body: authSchemas.login }),
  AuthController.login,
);
router.post("/verify-register-otp/", AuthController.verifyRegisterOtp);
router.post("/reset/password/", AuthController.passwordResetVerifyCheck);
router.patch(
  "/reset/update/password/",
  useValidation({ body: authSchemas.update_reset_password }),
  AuthController.passwordUpdate,
);

router.post("/refresh", AuthController.refreshToken);
router.post("/logout", AuthController.logout);
router.get("/profile", authMiddleware, UserController.profile);
router.put(
  "/profile/update",
  authMiddleware,
  uploadAvatar,
  useValidation({ body: profileSchemas.update }),
  UserController.updateProfile,
);
router.patch(
  "/update-password",
  authMiddleware,
  useValidation({ body: authSchemas.update_new_password }),
  AuthController.updateNewPassword,
);
router.post(
  "/request-change-email",
  authMiddleware,
  AuthController.requestChangeEmail,
);
// confirm-change-email
router.put(
  "/confirm-change-email",
  authMiddleware,
  useValidation({ body: authSchemas.update_new_email }),
  AuthController.changeEmail,
);
router.get("/test", authMiddleware, (req: Request, res: Response) => {
  res.send("Auth middlwere route working");
});

// updatepassword
// updateemail

// proofile
// middlewareAuth
// router.post("/register/2", (req, res) => {
//   console.log("🔥 REGISTER HIT");
//   res.send("OK");
// });
// เช็คแค่ว่า login อยู่
// router.get("/profile", authMiddleware, UserController.getProfile);

// // เฉพาะ admin
// router.delete("/users/:id", authMiddleware, requireRole("admin"), UserController.deleteUser);

// // เช็ค permission
// router.post("/users", authMiddleware, requirePermission("create_user"), UserController.create);

// // เช็คทั้ง role และ permission
// router.patch("/users/:id",
//   authMiddleware,
//   requireRole("admin"),
//   requirePermission("update_user"),
//   UserController.update
// );
export default router;
