import { Request, Response } from "express";
import { authService } from "./auth.service";
import catchAsync from "../../../shared/catchAsync";
import { IJWTPayload } from "../../../types/common";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  const { accessToken, refreshToken, needPasswordChange } = result;

  res.cookie("accessToken", accessToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    message: "User login successful",
    data: {
      accessToken,
      refreshToken,
      needPasswordChange,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not found",
    });
  }

  const result = await authService.refreshToken(refreshToken);
  const { accessToken, newRefreshToken } = result;

  res.cookie("accessToken", accessToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", newRefreshToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

const changePassword = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const userId = req.user?.userId;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Call the authService to change the password
    await authService.changePassword(userId, oldPassword, newPassword);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  },
);

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  // Call the authService to handle forgot password logic
  await authService.forgotPassword(email);

  res.status(200).json({
    success: true,
    message: "Password reset link sent to your email",
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  // Call the authService to handle reset password logic
  await authService.resetPassword(token, newPassword);

  res.status(200).json({
    success: true,
    message: "Password has been reset successfully",
  });
});

const getMe = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const userSession = req.cookies;
    const result = await authService.getMe(userSession);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User retrieved successfully",
      data: result,
    });
  },
);
export const authController = {
  login,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};
