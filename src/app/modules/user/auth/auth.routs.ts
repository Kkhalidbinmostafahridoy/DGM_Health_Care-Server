import express from "express";
import { auth } from "../../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { authController } from "./auth.controller";
const router = express.Router();

router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/change-password",
  auth(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  authController.changePassword,
);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/admin-login", authController.login);
router.post("/doctor-login", authController.login);
router.get(
  "/me",
  auth(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  authController.getMe,
);

export const authRoutes = router;
