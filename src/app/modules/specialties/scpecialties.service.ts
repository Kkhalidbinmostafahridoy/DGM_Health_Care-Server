import { Specialties } from "@prisma/client";
import { Request } from "express";

import { fileUploader } from "../../Helper/FileUploader";
import { prisma } from "../../shared/prisma";

import { paginationHelper } from "../../Helper/paginationHelper";
import { IPaginationOptions } from "../../interface/IPagination";

const insertIntoDB = async (req: Request) => {
  const file = req.file;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    req.body.icon = uploadToCloudinary?.secure_url;
  }

  // ✅ Pass all required Prisma fields: title, name, icon, and optional description
  const payload = {
    title: req.body.title,
    name: req.body.name,
    description: req.body.description || null,
    icon: req.body.icon,
  };

  const result = await prisma.specialties.create({
    data: payload,
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
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
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
  insertIntoDB,
  getAllFromDB,
  deleteFromDB,
};
