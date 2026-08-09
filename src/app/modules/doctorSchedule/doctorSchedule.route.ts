import express from "express";
import { doctorScheduleController } from "./doctorSchedule.controller";
import { auth } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post("/", auth(UserRole.DOCTOR), doctorScheduleController.insertIntoDB);

export const doctorScheduleRoutes = router;
