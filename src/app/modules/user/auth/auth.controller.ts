import { Request, Response } from "express";
import { authService } from "./auth.service";
import catchAsync from "../../../shared/catchAsync";

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  res.status(200).json({
    success: true,
    message: "user Login successful",
    data: result,
  });
});

export const authController = {
  login,
};
