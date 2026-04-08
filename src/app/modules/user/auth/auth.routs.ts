import express from "express";
import { authController } from "./auth.controller";
import { userController } from "../user.controller";
const router = express.Router();

router.post("/login", authController.login);
router.post("/admin-login", authController.login);
router.post("/doctor-login", authController.login);
router.post("/create-patient", authController.login);

export const authRoutes = router;
