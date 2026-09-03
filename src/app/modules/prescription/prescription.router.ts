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
router.get(
  "/my-Prescription",
  auth(UserRole.ADMIN, UserRole.PATIENT),
  prescriptionController.myPrescription,
);
export const prescriptionRoutes = router;
