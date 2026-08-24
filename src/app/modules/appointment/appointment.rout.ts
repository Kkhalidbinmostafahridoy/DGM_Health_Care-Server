import express from "express";
import { appointmentCollect } from "./appointment.collection";

const router = express.Router();

router.post("/", appointmentCollect.createAppointment);

export const appointmentRoutes = router;
