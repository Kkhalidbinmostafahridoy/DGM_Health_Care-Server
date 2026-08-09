import express from "express";
import { scheduleController } from "./schedule.controller";

const router = express.Router();

router.post("/", scheduleController.insertIntoDB);

router.get("/", scheduleController.scheduleForDoctor);

router.delete("/:id", scheduleController.deleteScheduleFromDb);

export const ScheduleRoutes = router;
