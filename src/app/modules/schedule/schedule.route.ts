import express from "express";
import { scheduleController } from "./schedule.controller";
import { auth } from "../../middlewares/auth";

enum UserRole {
  DOCTOR = "DOCTOR",
  ADMIN = "ADMIN",
  PATIENT = "PATIENT",
}

const router = express.Router();

router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.DOCTOR),
  scheduleController.insertIntoDB,
);

router.get(
  "/",
  auth(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT),
  scheduleController.scheduleForDoctor,
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN),
  scheduleController.deleteScheduleFromDb,
);

export const ScheduleRoutes = router;
