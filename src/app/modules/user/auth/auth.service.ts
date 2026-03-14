import { Request } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/prisma";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserStatus from "@prisma/client";

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

  const accessToken = jwt.sign({ email: user.email, role: user.role }, "abc", {
    algorithm: "HS256",
    expiresIn: "1h",
  });
  return {
    accessToken,
  };

  console.log(payload);
  return user;
};

export const authService = {
  login,
};
