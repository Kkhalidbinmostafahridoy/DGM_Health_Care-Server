import express, { Request, Response, NextFunction } from "express";
import { userController } from "./user.controller";
import { fileUploader } from "../../Helper/FileUploader";
import { UserValidation } from "./user.validation";

const router = express.Router();

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
  router.get("/get-patient", userController.getPatient));

export const userRoutes = router;
