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
router.post(
  "/admins",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("BODY:", req.body);

      const data = req.body.data || req.body;

      const parsedData = typeof data === "string" ? JSON.parse(data) : data;

      const validated =
        UserValidation.createAdminZodValidationSchema.parse(parsedData);

      req.body = validated;

      next();
    } catch (error) {
      next(error);
    }
  },
  userController.createAdmin,
);
router.get("/doctors", userController.getDoctors);

export const userRoutes = router;
