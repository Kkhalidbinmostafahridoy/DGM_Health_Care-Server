import { Request, Response } from "express";
import { authService } from "./auth.service";
import catchAsync from "../../../shared/catchAsync";

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  const { accessToken, refreshToken, needPasswordChange } = result;

  res.cookie("accessToken", accessToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  res.status(200).json({
    success: true,
    message: "user Login successful",
    data: {
      needPasswordChange,
    },
  });
});

export const authController = {
  login,
};
