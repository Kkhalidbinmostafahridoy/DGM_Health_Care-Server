import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { metaDataService } from "./meta.service";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { IJWTPayload } from "../../types/common";

const fetchDashboardMetaData = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await metaDataService.fetchDashboardMetaData(
      user as IJWTPayload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "create metadata successfully",
      data: result,
    });
  },
);

export const metaDataController = {
  fetchDashboardMetaData,
};
