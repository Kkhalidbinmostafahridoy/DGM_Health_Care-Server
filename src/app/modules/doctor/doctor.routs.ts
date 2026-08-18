import express from "express";
import { doctorController } from "./doctor.controller";

const router = express.Router();

router.get("/", doctorController.getAllFromDB);

router.patch("/:id", doctorController.updateIntoDB);

export const doctorRoutes = router;
