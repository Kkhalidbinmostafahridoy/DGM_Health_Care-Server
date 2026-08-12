// import { Request } from "express";
// import { specialtiesController } from "./specialties.controller";
// import { fileUploader } from "../../Helper/FileUploader";
// import { prisma } from "../../shared/prisma";
// import { Specialties } from "@prisma/client";

// interface IDeletePayload {
//   id: string;
// }

// interface ISpecialtiesService {
//   insertIntoDB: (req: Request) => Promise<Specialties>;
//   getAllFromDB: (req?: unknown) => Promise<Specialties[]>;
//   deleteFromDB: (payload: IDeletePayload) => Promise<Specialties>;
// }

// const insertIntoDB = async (req: Request): Promise<Specialties> => {
//   const file = req.file;
//   if (file) {
//     const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
//     req.body.icon = uploadToCloudinary?.secure_url;
//   }

//   const result = await prisma.specialties.create({
//     data: req.body,
//   });
//   return result;
// };

// const getAllFromDB = async (req?: unknown): Promise<Specialties[]> => {
//   return await prisma.specialties.findMany();
// };

// const deleteFromDB = async (payload: IDeletePayload): Promise<Specialties> => {
//   const result = await prisma.specialties.delete({
//     where: { id: payload.id },
//   });
//   return result;
// };

// export const specialtiesService: ISpecialtiesService = {
//   insertIntoDB,
//   getAllFromDB,
//   deleteFromDB,
// };

import { Specialties } from "@prisma/client";
import { Request } from "express";
import { fileUploader } from "../../Helper/FileUploader";
import { prisma } from "../../shared/prisma";
import { paginationHelper } from "../../Helper/paginationHelper";
import { IPaginationOptions } from "../../interface/IPagination";

const inserIntoDB = async (req: Request) => {
  const file = req.file;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    req.body.icon = uploadToCloudinary?.secure_url;
  }

  const result = await prisma.specialties.create({
    data: req.body,
  });

  return result;
};

const getAllFromDB = async (options: IPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);

  const result = await prisma.specialties.findMany({
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
  });

  const total = await prisma.specialties.count();

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const deleteFromDB = async (id: string): Promise<Specialties> => {
  const result = await prisma.specialties.delete({
    where: {
      id,
    },
  });
  return result;
};

export const SpecialtiesService = {
  inserIntoDB,
  getAllFromDB,
  deleteFromDB,
};
