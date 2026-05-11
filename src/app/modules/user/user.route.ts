import express, { Request, Response, NextFunction } from "express";
import { userController } from "./user.controller";
import { fileUploader } from "../../Helper/FileUploader";
import { UserValidation } from "./user.validation";
import { UserRole } from "@prisma/client";
import { auth } from "../../middlewares/auth";

const router = express.Router();

// get all users (admin and doctor only)
router.get(
  "/",
  auth(UserRole?.ADMIN as any, UserRole?.DOCTOR as any),
  userController.getAllFromDB,
);

// create patient (admin and doctor only)
router.post(
  "/create-patient",
  auth(UserRole?.ADMIN as any, UserRole?.DOCTOR as any),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body.data || req.body;
      const parsedData = typeof data === "string" ? JSON.parse(data) : data;

      const validated =
        UserValidation.createPatientZodValidationSchema.parse(parsedData);

      req.body = validated;
      next();
    } catch (error) {
      next(error);
    }
  },
  userController.createPatient,
);

// get all patients (admin and doctor only)
(router.get("/get-all", userController.getAllFromDB),
  router.get("/get-patient", userController.getPatient),
  //
  //
  // admin create doctor
  router.post(
    "/admins",
    auth(UserRole?.ADMIN as any),
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
  ));

//
//
// doctor create doctor (admin only)
router.post(
  "/doctors",
  auth(UserRole?.ADMIN as any),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("BODY:", req.body);
      console.log("FILE:", req.file);

      const data = req.body.data || req.body;
      const parsedData = typeof data === "string" ? JSON.parse(data) : data;

      req.body = parsedData;
      next();
    } catch (error) {
      next(error);
    }
  },
  userController.createDoctor,
);

export const userRoutes = router;
