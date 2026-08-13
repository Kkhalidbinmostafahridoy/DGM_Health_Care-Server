import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import pick from "../../Helper/pick";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { doctorService } from "./doctor.service";
import { doctorFilterableFields } from "./doctor.content";

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ["page", "sortBy", "limit", "sortOrder"]);
  const filters = pick(req.query, doctorFilterableFields);

  const result = await doctorService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "get add doctor data",
    meta: result.meta,
    data: result.data,
  });
});

export const doctorController = {
  getAllFromDB,
};
