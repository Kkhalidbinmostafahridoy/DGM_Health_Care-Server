import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  let success = false;
  let message = err.message || "Something went wrong!";
  let error = err;

  //prisma error handling
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      message = "Duplicate key error";
      error = err.meta;
    }
    if (err.code === "P2025") {
      message = "Record not found";
      error = err.meta;
    }
    if (err.code === "P2003") {
      message = "Foreign key constraint failed";
      error = err.meta;
    }
    if (err.code === "P2004") {
      message = "A constraint failed on the database";
      error = err.meta;
    }
    if (err.code === "P2005") {
      message = "A value is too long for the column";
      error = err.meta;
    }
    if (err.code === "P2006") {
      message = "The provided value is invalid for the column";
      error = err.meta;
    }
    if (err.code === "P1000") {
      message = "Database connection error";
      error = err.meta;
    }
    if ((err.code = "P1001")) {
      message = "Database connection error";
      error = err.meta;
    }
  }

  res.status(statusCode).json({
    success,
    message,
    error,
  });
};

export default globalErrorHandler;
