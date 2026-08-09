import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";

const insertIntoDB = async (user: any, payload: any) => {
  console.log("user", user);
  console.log("payload", payload);
  return {
    user,
    payload,
  };
};

export const doctorScheduleService = {
  insertIntoDB,
};
