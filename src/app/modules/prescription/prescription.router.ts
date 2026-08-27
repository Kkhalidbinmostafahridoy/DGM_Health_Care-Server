import express from "express";
import { auth } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { prescriptionController } from "./prescription.controller";

const router = express.Router();
router.post(
  "/",
  auth(UserRole.DOCTOR),
  prescriptionController.createPrescription,
);
router.get("/GetAppPrescription", auth(UserRole.ADMIN, UserRole.PATIENT)); //eta korbo
export const prescriptionRoutes = router;
