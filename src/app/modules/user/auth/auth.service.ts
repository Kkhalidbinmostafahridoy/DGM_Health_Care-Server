import { Request } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import UserStatus from "@prisma/client";
import { jwtHelper } from "../../../Helper/jwt.helper";

const login = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
      status: UserStatus?.ACTIVE,
    },
  });
  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    user?.password,
  );
  if (!isCorrectPassword) {
    throw new Error("Password is incorrect");
  }

  if (!user) {
    throw new Error("User not found");
  }

  const accessToken = jwtHelper.generateToken(
    { email: user.email, role: user.role },
    "abc",
    "15m",
  );

  const refreshToken = jwtHelper.generateToken(
    { email: user.email, role: user.role },
    "abc123",
    "7d",
  );
  return {
    accessToken,
    refreshToken,
    needPasswordChange: user.needPasswordChange,
  };

  console.log(payload);
  return user;
};

export const authService = {
  login,
};
