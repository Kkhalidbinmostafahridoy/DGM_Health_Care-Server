import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { appointmentService } from "./appointment.service";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";

const createAppointment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await appointmentService.createAppointment(req.body);
  console.log(result);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "create appointment successfully",
    data: result,
  });
});
export const appointmentCollect = {
  createAppointment,
};
