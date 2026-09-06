import { IJWTPayload } from "../../types/common";
import { NextFunction } from "express";
import { metaDataController } from "./meta.controller";
import { UserRole } from "@prisma/client";
import ApiErrorHandler from "../../error/apiErrorHandler";
import httpStatus from "http-status";

const fetchDashboardMetaData = async (user: IJWTPayload) => {
  let metaData;
  switch (user.role) {
    case UserRole.ADMIN:
      metaData = "Admin metadata";
      break;
    case UserRole.DOCTOR:
      metaData = "Doctor metadata";
      break;
    case UserRole.PATIENT:
      metaData = "Patient metadata";
      break;
    default:
      throw new ApiErrorHandler(httpStatus.BAD_REQUEST, "invalid user role!");
  }
  return metaData;
};

export const metaDataService = {
  fetchDashboardMetaData,
};
