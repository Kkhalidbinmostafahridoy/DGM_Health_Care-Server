import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { UserService } from "./user.service";
import sendResponse from "../../shared/sendResponse";
import pick from "../../Helper/pick";
import * as jwt from "jsonwebtoken";
import { IJWTPayload } from "../../types/common";
import httpStatus from "http-status";

const createPatient = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createPatient(req);

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

const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createDoctor(req);

  const token = jwt.sign(
    {
      userId: result.user.id,
      role: result.user.UserRole,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: false, // true in production
    sameSite: "lax",
  });

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
  ]); //searching ,filtering
  const options = pick(req.query, ["page", "limit", "sortby", "sortOrder"]); //pagination, sorting

  const result = await UserService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMyProfile = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await UserService.getMyProfile(user as IJWTPayload);

    sendResponse(res, {
      success: true,
      message: "get my profile successfully",
      statusCode: httpStatus.OK,
      data: result,
    });
  },
);
export const userController = {
  createPatient,
  getPatient,
  getAllFromDB,
  createAdmin,
  createDoctor,
  getMyProfile,
};
