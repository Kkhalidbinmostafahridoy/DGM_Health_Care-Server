import express from "express";
import { auth } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { appointmentController } from "./appointment.collection";

const router = express.Router();

router.get(
  "/my-appointments",
  auth(UserRole.PATIENT, UserRole.DOCTOR),
  appointmentController.getMyAppointments,
);

router.post(
  "/",
  auth(UserRole.PATIENT),
  appointmentController.createAppointment,
);

export const appointmentRoutes = router;
