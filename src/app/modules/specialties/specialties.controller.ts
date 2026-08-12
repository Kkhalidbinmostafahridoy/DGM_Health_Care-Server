// import { Request, Response } from "express";
// import catchAsync from "../../shared/catchAsync";
// import sendResponse from "../../shared/sendResponse";
// import HttpStatus from "http-status";
// import { specialtiesService } from "./scpecialties.service";

// const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
//   const result = await specialtiesService.insertIntoDB(req);

//   sendResponse(res, {
//     statusCode: HttpStatus.OK,
//     success: true,
//     message: "specialties create successfully",
//     data: result,
//   });
// });

// const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
//   const result = await specialtiesService.getAllFromDB(req);
//   sendResponse(res, {
//     statusCode: HttpStatus.OK,
//     success: true,
//     message: "specialties data fatch successfully",
//     data: result,
//   });
// });

// const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
//   const idParam = req.params.id;
//   const id = Array.isArray(idParam) ? idParam[0] : idParam;
//   const result = await specialtiesService.deleteFromDB({ id });
//   sendResponse(res, {
//     statusCode: HttpStatus.OK,
//     success: true,
//     message: "detele from successfully",
//     data: result,
//   });
// });

// export const specialtiesController = {
//   insertIntoDB,
//   getAllFromDB,
//   deleteFromDB,
// };

import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { SpecialtiesService } from "./scpecialties.service";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import pick from "../../Helper/pick";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await SpecialtiesService.inserIntoDB(req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Specialties created successfully!",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await SpecialtiesService.getAllFromDB(options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Specialties data fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const result = await SpecialtiesService.deleteFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Specialty deleted successfully",
    data: result,
  });
});

export const SpecialtiesController = {
  insertIntoDB,
  getAllFromDB,
  deleteFromDB,
};
