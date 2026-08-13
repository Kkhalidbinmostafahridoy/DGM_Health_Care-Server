import express, { NextFunction, Request, Response } from "express";
import { fileUploader } from "../../Helper/FileUploader";
import { UserRole } from "@prisma/client";
import { auth } from "../../middlewares/auth";
import { SpecialtiesController } from "./specialties.controller";
import { SpecialtiesValidation } from "./specialties.validation";

const router = express.Router();

// GET ALL
router.get("/", SpecialtiesController.getAllFromDB);

// CREATE
router.post(
  "/",
  fileUploader.upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body?.data) {
        return res.status(400).json({
          success: false,
          message: "data field is required in form-data",
        });
      }

      const parsedData = JSON.parse(req.body.data);
      const validatedData = SpecialtiesValidation.create.parse(parsedData);

      // Reassign validated output back to body
      req.body = validatedData;

      return await SpecialtiesController.insertIntoDB(req, res, next);
    } catch (error) {
      return next(error);
    }
  },
);

// DELETE (Fixed escaped slash "/:id")
router.delete("/:id", auth(UserRole.ADMIN), SpecialtiesController.deleteFromDB);

export const SpecialtiesRoutes = router;
