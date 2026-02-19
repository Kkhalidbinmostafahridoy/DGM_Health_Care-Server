import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { UserService } from "./user.service";

const createPatient = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createPatient(req.body);
  console.log("create Patient", req.body);
});

const getPatient = catchAsync(async (req: Request, res: Response) => {
  console.log("get Patient", req.body);
});

export const userController = {
  createPatient,
  getPatient,
};
