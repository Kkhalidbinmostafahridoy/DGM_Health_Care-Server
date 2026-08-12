import express from "express";
import { doctorScheduleController } from "./doctorSchedule.controller";
import { auth } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post("/", auth(UserRole.DOCTOR), doctorScheduleController.insertIntoDB);
router.patch(
  "/update",
  auth(UserRole.DOCTOR),
  doctorScheduleController.UpdateDoctorSchedule,
);
router.delete(
  "/delete",
  auth(UserRole.DOCTOR),
  doctorScheduleController.deleteDoctorSchedule,
);

export const doctorScheduleRoutes = router;
