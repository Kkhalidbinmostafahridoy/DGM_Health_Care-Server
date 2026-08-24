import express from "express";
import { doctorController } from "./doctor.controller";

const router = express.Router();

router.get("/", doctorController.getAllFromDB);

router.patch("/:id", doctorController.updateIntoDB);
router.post("/suggestion", doctorController.getAiSuggestion);
router.get("/:id", doctorController.getByIdFromDB);

export const doctorRoutes = router;
