import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { prescriptionService } from "./prescription.service";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { IJWTPayload } from "../../types/common";
import pick from "../../Helper/pick";

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

const myPrescription = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const options = pick(req.query, ["limit", "page", "sortBy", "orderBy"]);
    const result = await prescriptionService.myPrescription(
      options,
      user as IJWTPayload,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "get my prescription",
      success: true,
      meta: result.meta,
      data: result.data,
    });
  },
);
export const prescriptionController = {
  createPrescription,
  myPrescription,
};
