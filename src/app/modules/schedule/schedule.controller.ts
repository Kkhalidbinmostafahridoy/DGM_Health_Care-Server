import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { scheduleService } from "./schedule.service";
import pick from "../../Helper/pick";
// removed unused import

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await scheduleService.insertIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "schedule created",
    data: result,
  });
});

const scheduleForDoctor = catchAsync(async (req: Request, res: Response) => {
  const option = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const filter = pick(req.query, ["startDateTime", "endDateTime"]);

  const result = await scheduleService.scheduleForDoctor(filter, option);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successfully create doctor",
    data: result.data,
    meta: result.meta,
  });
});

const deleteScheduleFromDb = catchAsync(async (req: Request, res: Response) => {
  const rawId = (req.params as any).id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);
  const result = await scheduleService.deleteScheduleFromDb(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Schedule deleted successfully",
    data: result,
  });
});

export const scheduleController = {
  insertIntoDB,
  scheduleForDoctor,
  deleteScheduleFromDb,
};
