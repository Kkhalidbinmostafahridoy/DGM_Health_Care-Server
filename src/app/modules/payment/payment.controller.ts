import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { paymentService } from "./payment.service";

const paymentCreate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await paymentService.paymentCreate(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "payment Create Successfully",
    success: true,
    data: result,
  });
});

export const paymentController = {
  paymentCreate,
};
