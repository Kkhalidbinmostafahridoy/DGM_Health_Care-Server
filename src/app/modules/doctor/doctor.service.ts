// import { PrismaClient } from "@prisma/client";
// import { paginationHelper } from "../../Helper/paginationHelper";
// import { doctorSearchableFields } from "./doctor.content";
// import { equal } from "assert";

// const prisma = new PrismaClient();

// const getAllFromDB = async (filters: any, options: any) => {
//   const { page, limit, sortBy, sortOrder, skip } =
//     paginationHelper.calculatePagination(options);
//   const { searchTerm, ...filterData } = filters;

//   const andConditions: Prisma.DoctorWhereInput[] = [];

//   if (searchTerm) {
//     andConditions.push({
//       OR: doctorSearchableFields.map((field) => ({
//         [field]: {
//           contains: searchTerm,
//           mode: "insensitive",
//         },
//       })),
//     });
//   }

//   if (Object.keys(filterData).length > 0) {
//     const filterConditions = Object.keys(filterData).map((key: any) => ({
//       [key]: {
//         equals: (filterData as any)[key],
//       },
//     }));

//     andConditions.push(...filterConditions);
//   }

//   const whereConditons: Prisma.DoctorWhereInput =
//     andConditions.length > 0 ? { AND: andConditions } : {};

//   const result = await prisma.doctor.findMany({
//     where: whereConditons,
//     skip,
//     take: limit,
//     orderBy: {
//       [sortBy]: sortOrder,
//     },
//   });

//   const total = await prisma.doctor.count({ where: whereConditons });
//   return {
//     meta: {
//       total,
//       page,
//       limit,
//     },
//     data: result,
//   };

//   console.log(page, limit, skip, sortBy, sortOrder);
// };

// export const doctorService = {
//   getAllFromDB,
// };

// doctor.service.ts

import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma"; // Use shared client instance
import { paginationHelper } from "../../Helper/paginationHelper";
import { doctorSearchableFields } from "./doctor.content";

const getAllFromDB = async (filters: any, options: any) => {
  const { page, limit, sortBy, sortOrder, skip } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, specialties, ...filterData } = filters;

  const andConditions: Prisma.DoctorWhereInput[] = [];

  // 1. Search term condition (only for String fields)
  if (searchTerm) {
    andConditions.push({
      OR: doctorSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // 2. Relational filtering for Specialties (if passed)
  if (specialties) {
    andConditions.push({
      doctorSpecialties: {
        some: {
          specialties: {
            title: {
              contains: specialties,
              mode: "insensitive",
            },
          },
        },
      },
    });
  }

  // 3. Exact match filters for scalar fields
  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as Record<string, unknown>)[key],
      },
    }));

    andConditions.push(...filterConditions);
  }

  const whereConditions: Prisma.DoctorWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Query Database
  const result = await prisma.doctor.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" }, // Fallback default sorting
    include: {
      doctorSpecialties: {
        include: {
          specialties: true,
        },
      },
    },
  });

  const total = await prisma.doctor.count({ where: whereConditions });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

export const doctorService = {
  getAllFromDB,
};
