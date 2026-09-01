import { Request, Response } from "express";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import { ReviewService } from "./review.service";
import { IJWTPayload } from "../../types/common";

const insertIntoDB = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await ReviewService.insertIntoDB(req.body, user);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Review added successfully",
      data: result,
    });
  },
);

export const ReviewController = {
  insertIntoDB,
};
