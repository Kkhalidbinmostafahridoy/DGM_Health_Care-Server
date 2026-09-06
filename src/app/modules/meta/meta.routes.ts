import express from "express";
import { auth } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { metaDataController } from "./meta.controller";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  metaDataController.fetchDashboardMetaData,
);

export const metaRoutes = router;
