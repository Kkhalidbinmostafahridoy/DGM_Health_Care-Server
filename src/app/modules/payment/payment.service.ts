import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";

const paymentCreate = async (payload: any, body?: any) => {
  console.log(paymentCreate);
};

export const paymentService = {
  paymentCreate,
};
