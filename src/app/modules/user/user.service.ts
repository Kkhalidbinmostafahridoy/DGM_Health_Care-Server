import { Request } from "express";
import { prisma } from "../../shared/prisma";
import bcrypt from "bcryptjs";
import { fileUploader } from "../../Helper/FileUploader";
import { IOptions, paginationHelper } from "../../Helper/paginationHelper";
import { UserGender } from "@prisma/client";

// create patient (admin and doctor only)
// const createPatient = async (req: Request) => {
//   const body = req.body;
//   const patient = body.patient;

//   console.log("SERVICE BODY:", body);

//   // ✅ VALIDATION
//   if (!patient?.email) {
//     throw new Error("Patient email is missing");
//   }

//   console.log("EMAIL:", patient.email);

//   // upload file
//   let profilePhoto = null;

//   if (req.file) {
//     const uploaded = await fileUploader.uploadToCloudinary(req.file);

//     profilePhoto = uploaded?.secure_url;
//   }

//   // check email
//   const existingEmail = await prisma.user.findUnique({
//     where: {
//       email: patient?.email,
//     },
//   });

//   if (existingEmail) {
//     throw new Error("Email already exists");
//   }

//   const hashedPassword = await bcrypt.hash(body.password, 10);

//   const result = await prisma.$transaction(async (tnx: any) => {
//     const user = await tnx.user.create({
//       data: {
//         email: patient?.email,
//         password: hashedPassword,
//         role: "PATIENT", // ✅ FIXED
//       },
//     });

//     const patientData = await tnx.patient.create({
//       data: {
//         name: patient.name,
//         email: patient.email,
//         age: Number(patient.age),
//         address: patient.address,
//         gender: patient.gender,
//         profilePhoto,
//         userId: user.id,
//       },
//     });

//     return {
//       user,
//       patient: patientData,
//     };
//   });

//   return result;
// };

const createPatient = async (req: Request) => {
  // 1. Extract the nested data safely
  const { patient: patientInfo, password } = req.body;

  // 2. Validate existence before calling Prisma
  if (!patientInfo || !patientInfo.email) {
    throw new Error("Patient data or email is missing in request body");
  }

  // 3. Handle File Upload
  let profilePhoto = null;
  if (req.file) {
    const uploaded = await fileUploader.uploadToCloudinary(req.file);
    profilePhoto = uploaded?.secure_url || null;
  }

  // 4. Check for existing user
  const existingEmail = await prisma.user.findUnique({
    where: {
      email: patientInfo.email,
    },
  });

  if (existingEmail) {
    throw new Error("Email already exists");
  }

  // 5. Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 6. Transaction
  const result = await prisma.$transaction(async (tnx) => {
    const user = await tnx.user.create({
      data: {
        email: patientInfo.email,
        password: hashedPassword,
        UserRole: "PATIENT",
      },
    });

    const patientData = await tnx.patient.create({
      data: {
        ...patientInfo, // Spreads name, email, age, etc.
        age: Number(patientInfo.age), // Ensure it's a number
        profilePhoto: profilePhoto, // Add the cloudinary URL
        userId: user.id,
      },
    });

    return { user, patient: patientData };
  });

  return result;
};
// doctor create doctor (admin only)

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
//
// admin create doctor (admin only)
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

// getallfrombd (admin and doctor only)
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
  createPatient,
  getAllFromDB,
  createAdmin,
  createDoctor,
};
