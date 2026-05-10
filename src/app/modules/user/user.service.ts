import { Request } from "express";
import { prisma } from "../../shared/prisma";
import bcrypt from "bcryptjs";
import { fileUploader } from "../../Helper/FileUploader";
import { IOptions, paginationHelper } from "../../Helper/paginationHelper";
import { UserGender } from "@prisma/client";

const cretePatient = async (req: Request) => {
  if (req?.file) {
    const uploadedResult = await fileUploader.uploadToCloudinary(req?.file);
    req.body.patient.profilePhoto = uploadedResult?.secure_url as string;
  }

  console.log("BODY:", req.body);
  console.log("FILE:", req.file);
  const hashPassword = await bcrypt.hash(req.body.password, 10);

  // for multipple query we can use transaction
  const result = await prisma.$transaction(async (tnx: any) => {
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

const createDoctor = async (req: Request) => {
  if (req?.file) {
    const uploadedResult = await fileUploader.uploadToCloudinary(req.file);

    req.body.profilePhoto = uploadedResult?.secure_url as string;
  }

  console.log("BODY:", req.body);

  // ✅ FIX HERE
  const hashPassword = await bcrypt.hash(req.body.password, 10);

  const result = await prisma.$transaction(async (tnx: any) => {
    const user = await tnx.user.create({
      data: {
        email: req.body.email,
        password: hashPassword,
        UserRole: "DOCTOR",
      },
    });
    const genderValue =
      req.body.gender === "Male" ? UserGender.Male : UserGender.Female;
    console.log("gender", genderValue);

    const doctor = await tnx.doctor.create({
      data: {
        email: req.body.email,
        name: req.body.name,
        address: req.body.address,
        registrationNumber: req.body.registrationNumber,
        appointmentFee: Number(req.body.appointmentFee),
        qualifications: req.body.qualifications,
        currentlyWorkingAt: req.body.currentlyWorkingAt,
        designation: req.body.designation,
        userId: user.id,
        gender: genderValue,
      },
    });

    return { user, doctor };
  });

  return result;
};

const createAdmin = async (req: Request) => {
  // ✅ Upload image (if exists)
  if (req.file) {
    const uploaded = await fileUploader.uploadToCloudinary(req.file);

    // ensure admin object exists
    if (!req.body.admin) req.body.admin = {};

    req.body.admin.profilePhoto = uploaded?.secure_url;
  }

  const existingEmail = await prisma.user.findUnique({
    where: {
      email: req.body.admin.email,
    },
  });
  if (existingEmail) {
    throw new Error("Email already exists");
  }

  // ✅ Hash password
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const result = await prisma.$transaction(async (tnx: any) => {
    const user = await tnx.user.create({
      data: {
        email: req.body.admin.email,
        password: hashedPassword,
        UserRole: "ADMIN",
      },
    });

    const admin = await tnx.admin.create({
      data: {
        ...req.body.admin,
        password: hashedPassword,
        userId: user.id,
      },
    });

    return { user, admin };
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
  createAdmin,
  createDoctor,
};
