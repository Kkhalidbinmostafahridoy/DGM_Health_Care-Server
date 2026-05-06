import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { UserService } from "./user.service";
import sendResponse from "../../shared/sendResponse";
import pick from "../../Helper/pick";
import * as jwt from "jsonwebtoken";

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

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createAdmin(req);

  // ✅ Create token
  const token = jwt.sign(
    {
      userId: result.user.id,
      role: result.user.UserRole,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  // ✅ Set cookie
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: false, // true in production
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin created successfully",
    data: result,
  });
});

const getDoctors = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getDoctor();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctors retrieved successfully",
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
  const filters = pick(req.query, [
    "email",
    "UserRole",
    "status",
    "searchTerm",
  ]);
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
  createAdmin,
  getDoctors,
};
