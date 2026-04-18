import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { UserService } from "./user.service";
import sendResponse from "../../shared/sendResponse";

const createPatient = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.cretePatient(req);

  console.log(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Patient created successfully",
    data: result,
  });
});

const getPatient = catchAsync(async (req: Request, res: Response) => {
  // console.log("get Patient", req.body);
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, searchTerm, sortBy, sortOrder, UserRole, status } =
    req.query;

  const result = await UserService.getAllFromDB({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    searchTerm: searchTerm as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as "asc" | "desc",
    UserRole: UserRole as string,
    status: status as string,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});
export const userController = {
  createPatient,
  getPatient,
  getAllFromDB,
};
