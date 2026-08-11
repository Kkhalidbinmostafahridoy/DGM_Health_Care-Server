import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";

import { doctorScheduleService } from "./doctorSchedule.service";
import { IJWTPayload } from "../../types/common";

const insertIntoDB = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await doctorScheduleService.insertIntoDB(
      user as IJWTPayload,
      req.body,
    );
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "doctor schedule created",
      data: result,
    });
  },
);
export const doctorScheduleController = {
  insertIntoDB,
};
