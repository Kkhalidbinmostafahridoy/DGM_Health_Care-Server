import express from "express";
import { userController } from "./user.controller";

const router = express.Router();

router.post("/create-patient", userController.createPatient);
router.get("/get-patient", userController.getPatient);

export const userRoutes = router;
