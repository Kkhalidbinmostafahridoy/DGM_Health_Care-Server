import { Request } from "express";
import { prisma } from "../../shared/prisma";
import bcrypt from "bcryptjs";
import { fileUploader } from "../../Helper/FileUploader";
import { email } from "zod";
import { IOptions, paginationHelper } from "../../Helper/paginationHelper";
import { UserStatus } from "@prisma/client";

const cretePatient = async (req: Request) => {
  if (req?.file) {
    const uploadedResult = await fileUploader.uploadToCloudinary(req?.file);
    req.body.patient.profilePhoto = uploadedResult?.secure_url as string;
  }

  console.log("BODY:", req.body);
  console.log("FILE:", req.file);
  const hashPassword = await bcrypt.hash(req.body.password, 10);

  // for multipple query we can use transaction
  const result = await prisma.$transaction(async (tnx) => {
    // 1️⃣ Create User
    const user = await tnx.user.create({
      data: {
        email: req.body.patient.email,
        password: hashPassword,
      },
    });
    const patient = await tnx.patient.create({
      data: {
        ...req.body.patient,
        password: hashPassword,
        userId: user.id,
      },
    });
    return { user, patient };
  });

  return result;
};

// const getAllFromDB = async (param: any, options: IOptions) => {
//   const { page, limit, sortBy, sortOrder, skip, take } =
//     paginationHelper.calculatePagination(options);

//   const { searchTerm, status, ...filterData } = param;

//   const andConditions = [];

//   if (status) {
//     andConditions.push({ UserStatus: status });
//   }

//   const whereConditions = searchTerm
//     ? {
//         OR: [
//           { email: { contains: searchTerm, mode: "insensitive" as const } },
//           { status: param.status },
//           { UserRole: param.UserRole },
//           {
//             patient: {
//               name: { contains: searchTerm, mode: "insensitive" as const },
//             },
//           },
//         ],
//       }
//     : {};

//   const orderBy =
//     sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" };

//   const result = await prisma.user.findMany({
//     where: whereConditions,
//     skip,
//     take,
//     include: {
//       patient: true,
//     },
//     orderBy,
//   });

//   const total = await prisma.user.count({ where: whereConditions });

//   return {
//     meta: {
//       page,
//       limit,
//       total,
//     },
//     data: result,
//   };
// };

const getAllFromDB = async (param: any, options: IOptions) => {
  const { page, limit, sortBy, sortOrder, skip, take } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, status, ...filterData } = param;

  const andConditions: any[] = [];

  // 1. Fix the "status" field name to match your Schema (UserStatus)
  if (status) {
    andConditions.push({
      UserStatus: status, // Changed from 'status' to 'UserStatus'
    });
  }

  // 2. Handle search term
  if (searchTerm) {
    andConditions.push({
      OR: [
        { email: { contains: searchTerm, mode: "insensitive" } },
        {
          patient: {
            name: { contains: searchTerm, mode: "insensitive" },
          },
        },
      ],
    });
  }

  // 3. Handle other filters (like UserRole)
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: (filterData as any)[key],
      })),
    });
  }

  // Final where clause
  const whereConditions =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const orderBy =
    sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" };

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take,
    include: {
      patient: true,
    },
    orderBy,
  });

  const total = await prisma.user.count({ where: whereConditions });

  return {
    meta: { page, limit, total },
    data: result,
  };
};
export const UserService = {
  cretePatient,
  getAllFromDB,
};
