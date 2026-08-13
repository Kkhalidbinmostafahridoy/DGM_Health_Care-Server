import { NextFunction, Request, Response } from "express";

import catchAsync from "../../shared/catchAsync";

import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { SpecialtiesService } from "./scpecialties.service";

const insertIntoDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("CONTROLLER BODY:", req.body);
    console.log("CONTROLLER FILE:", req.file);

    const result = await SpecialtiesService.insertIntoDB(req);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Specialties created successfully!",
      data: result,
    });
  },
);

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const options = {
    limit: req.query.limit ? Number(req.query.limit) : undefined,

    page: req.query.page ? Number(req.query.page) : undefined,

    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
  };

  const result = await SpecialtiesService.getAllFromDB(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Specialties data fetched successfully",

    meta: result.meta,

    data: result.data,
  });
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await SpecialtiesService.deleteFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Specialty deleted successfully",

    data: result,
  });
});

export const SpecialtiesController = {
  insertIntoDB,
  getAllFromDB,
  deleteFromDB,
};
