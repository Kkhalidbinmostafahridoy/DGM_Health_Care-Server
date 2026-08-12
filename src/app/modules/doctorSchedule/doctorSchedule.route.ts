import express from "express";
import { doctorScheduleController } from "./doctorSchedule.controller";
import { auth } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { doctorScheduleValidation } from "./doctorSchedule.validation";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.DOCTOR),
  validateRequest(
    doctorScheduleValidation.createDoctorSCheduleValidationSchema,
  ) as unknown as express.RequestHandler,
  doctorScheduleController.insertIntoDB,
);
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
