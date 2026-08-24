import express from "express";
import { appointmentCollect } from "./appointment.collection";
import { auth } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post("/", auth(UserRole.PATIENT), appointmentCollect.createAppointment);

export const appointmentRoutes = router;
