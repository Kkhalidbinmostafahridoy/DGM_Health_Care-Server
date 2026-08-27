import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { appointmentService } from "./appointment.service";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { IJWTPayload } from "../../types/common";
import { prisma } from "../../shared/prisma";
import pick from "../../Helper/pick";

// const createAppointment = catchAsync(
//   async (req: Request & { user?: IJWTPayload }, res: Response) => {
//     const user = req.body;
//     const result = await appointmentService.createAppointment(
//       user as IJWTPayload,
//       req.body,
//     );
//     console.log(result);
//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "create appointment successfully",
//       data: result,
//     });
//   },
// );
const createAppointment = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;

    const result = await appointmentService.createAppointment(
      user as IJWTPayload,
      req.body,
    );

    console.log(result);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "create appointment successfully",
      data: result,
    });
  },
);

const getMyAppointments = catchAsync(async (req: Request, res: Response) => {
  const option = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const filters = pick(req.query, ["status", "paymentStatus"]);
  const user = req.user;
  const result = await appointmentService.getMyAppointments(
    user as IJWTPayload,
    filters,
    option,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "get patient appointment details",
    data: result,
  });
});
export const appointmentController = {
  createAppointment,
  getMyAppointments,
};
