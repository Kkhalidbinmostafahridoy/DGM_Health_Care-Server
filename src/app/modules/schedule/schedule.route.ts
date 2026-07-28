import express from "express";
import { scheduleController } from "./schedule.controller";

const router = express.Router();

router.post("/", scheduleController.insertIntoDB);
export const ScheduleRoutes = router;
