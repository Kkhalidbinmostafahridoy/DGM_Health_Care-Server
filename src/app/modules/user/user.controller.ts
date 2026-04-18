import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { UserService } from "./user.service";
import sendResponse from "../../shared/sendResponse";

const createPatient = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.cretePatient(req);

  console.log(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Patient created successfully",
    data: result,
  });
});

const getPatient = catchAsync(async (req: Request, res: Response) => {
  // console.log("get Patient", req.body);
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  // Extract queries and provide defaults or handle undefined
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const searchTerm = req.query.searchTerm as string | undefined;
  const sortBy = req.query.sortBy as string | undefined;
  const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

  // Clean the searchTerm: if it's the string "undefined", make it undefined
  const cleanedSearch = searchTerm === "undefined" ? undefined : searchTerm;

  const result = await UserService.getAllFromDB({
    page,
    limit,
    searchTerm: cleanedSearch,
    sortBy,
    sortOrder,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta, // Added metadata for pagination
    data: result.data,
  });
});
export const userController = {
  createPatient,
  getPatient,
  getAllFromDB,
};
