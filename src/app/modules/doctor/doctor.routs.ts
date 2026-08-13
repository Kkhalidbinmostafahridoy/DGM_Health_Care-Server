import express from "express";
import { doctorController } from "./doctor.controller";

const router = express.Router();

router.get("/", doctorController.getAllFromDB);

export const doctorRoutes = router;
