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

const getAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAdmin();
  console.log("get Admin", result);
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, searchTerm } = req.query;
  const result = await UserService.getAllFromDB({
    page: Number(page),
    limit: Number(limit),
    searchTerm: String(searchTerm),
  });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

const getDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getDoctor();
  console.log("get Doctor", result);
});

export const userController = {
  createPatient,
  getPatient,
  getAllFromDB,
  getDoctor,
  getAdmin,
};
