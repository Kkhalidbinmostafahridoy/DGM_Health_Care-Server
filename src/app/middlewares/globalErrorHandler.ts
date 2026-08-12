import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // if status code fixed use statusCode:number and err.statusCode || in error object else use 500
  let statusCode: number = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let success = false;
  let message = err.message || "Something went wrong!";
  let error = err;

  //prisma error handling
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      message = "Duplicate key error";
      error = err.meta;
      statusCode = httpStatus.CONFLICT;
    }
    if (err.code === "P2025") {
      message = "Record not found";
      error = err.meta;
      statusCode = httpStatus.NOT_FOUND;
    }
    if (err.code === "P2003") {
      message = "Foreign key constraint failed";
      error = err.meta;
      statusCode = httpStatus.BAD_REQUEST;
    }
    if (err.code === "P2004") {
      message = "A constraint failed on the database";
      error = err.meta;
      statusCode = httpStatus.BAD_REQUEST;
    }
    if (err.code === "P2005") {
      message = "A value is too long for the column";
      error = err.meta;
      statusCode = httpStatus.BAD_REQUEST;
    }
    if (err.code === "P2006") {
      message = "The provided value is invalid for the column";
      error = err.meta;
      statusCode = httpStatus.EXPECTATION_FAILED;
    }
    if (err.code === "P1000") {
      message = "Database connection error";
      error = err.meta;
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    }
    if ((err.code = "P1001")) {
      message = "Database connection error";
      error = err.meta;
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    message = "Validation error";
    error = err.meta;
    statusCode = httpStatus.BAD_REQUEST;
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    message = "Unknown request error";
    error = err.meta;
    statusCode = httpStatus.BAD_REQUEST;
  }
  if (err instanceof Prisma.PrismaClientRustPanicError) {
    message = "Rust panic error";
    error = err.meta;
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    message = "Initialization error";
    error = err.meta;
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  }

  res.status(statusCode).json({
    success,
    message,
    error,
  });
};

export default globalErrorHandler;
