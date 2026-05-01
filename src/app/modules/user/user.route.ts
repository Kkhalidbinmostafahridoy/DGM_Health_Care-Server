import express, { Request, Response, NextFunction } from "express";
import { userController } from "./user.controller";
import { fileUploader } from "../../Helper/FileUploader";
import { UserValidation } from "./user.validation";
import UserRole from "@prisma/client";
import { auth } from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth(UserRole?.ADMIN as any, UserRole?.DOCTOR as any),
  userController.getAllFromDB,
);

(router.post(
  "/create-patient",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = UserValidation.createPatientZodValidationSchema.parse(
      JSON.parse(req.body.data),
    );
    return userController.createPatient(req, res, next);
  },
),
  router.get("/get-all", userController.getAllFromDB),
  router.get("/get-patient", userController.getPatient));

router.get("/admins", userController.getAdmins);
router.get("/doctors", userController.getDoctors);

export const userRoutes = router;
