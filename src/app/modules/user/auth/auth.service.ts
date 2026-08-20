import { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";
import { jwtHelper } from "../../../Helper/jwt.helper";
import ApiErrorHandler from "../../../error/apiErrorHandler";
import httpStatus from "http-status";

const login = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new ApiErrorHandler(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.UserStatus !== UserStatus.ACTIVE) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      `User is ${user.UserStatus.toLowerCase()}`,
    );
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    user.password,
  );
  if (!isCorrectPassword) {
    throw new ApiErrorHandler(httpStatus.BAD_REQUEST, "Password is incorrect");
  }

  const accessToken = jwtHelper.generateToken(
    { email: user.email, role: user.UserRole, userId: user.id },
    process.env.JWT_SECRET as string,
    "15m",
  );

  const refreshToken = jwtHelper.generateToken(
    { email: user.email, role: user.UserRole, userId: user.id },
    process.env.JWT_SECRET as string,
    "7d",
  );

  return {
    accessToken,
    refreshToken,
    needPasswordChange: user.needPasswordChange,
  };
};

export const authService = {
  login,
};
