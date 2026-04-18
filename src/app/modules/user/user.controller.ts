import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { UserService } from "./user.service";
import sendResponse from "../../shared/sendResponse";
import pick from "../../Helper/pick";

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
  //page,limit,sortBy,sortOrder-pagination and sorting
  //searchTerm - searching
  //UserRole, status - filtering
  //fields :searchTerm,filtering
  const filters = pick(req.query, ["email", "UserRole", "status"]);
  const options = pick(req.query, ["page", "limit", "sortby", "sortOrder"]);

  const result = await UserService.getAllFromDB(filters, options);

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
