import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { prescriptionService } from "./prescription.service";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { IJWTPayload } from "../../types/common";

const createPrescription = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await prescriptionService.createPrescription(
      user as IJWTPayload,
      req.body,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "create prescription",
      data: result,
    });
  },
);
export const prescriptionController = {
  createPrescription,
};
