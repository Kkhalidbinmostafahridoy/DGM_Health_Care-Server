import { Request } from "express";
import { prisma } from "../../shared/prisma";
import bcrypt from "bcryptjs";
import { fileUploader } from "../../Helper/FileUploader";
import { IOptions, paginationHelper } from "../../Helper/paginationHelper";
import { UserGender, UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import ApiErrorHandler from "../../error/apiErrorHandler";
import { IJWTPayload } from "../../types/common";

// create patient (admin and doctor only)
const createPatient = async (req: Request) => {
  // 1. Extract the nested data safely
  const { patient: patientInfo, password } = req.body;

  // 2. Validate existence before calling Prisma
  if (!patientInfo || !patientInfo.email) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      "Patient data or email is missing in request body",
    );
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
    throw new ApiErrorHandler(httpStatus.CONFLICT, "Email already exists");
  }

  // 5. Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 6. Transaction
  const result = await prisma.$transaction(async (tnx: any) => {
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

//
//
const createDoctor = async (req: Request) => {
  const doctorData = req.body.doctor || req.body;
  const doctorEmail = doctorData.email || req.body.email;
  const password = req.body.password || doctorData.password;

  if (!doctorEmail || !password) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      "Doctor email and password are required",
    );
  }

  if (req?.file) {
    const uploadedResult = await fileUploader.uploadToCloudinary(req.file);
    doctorData.profilePhoto = uploadedResult?.secure_url as string;
  }

  const existingEmail = await prisma.user.findUnique({
    where: {
      email: doctorEmail,
    },
  });

  if (existingEmail) {
    throw new ApiErrorHandler(httpStatus.CONFLICT, "Email already exists");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tnx: any) => {
    const user = await tnx.user.create({
      data: {
        email: doctorEmail,
        password: hashPassword,
        UserRole: "DOCTOR",
      },
    });

    const genderValue =
      doctorData.gender === "Male" ? UserGender.Male : UserGender.Female;

    const doctor = await tnx.doctor.create({
      data: {
        email: doctorEmail,
        name: doctorData.name,
        contactNumber: doctorData.contactNumber || null,
        address: doctorData.address,
        registrationNumber: doctorData.registrationNumber,
        experience: doctorData.experience ? Number(doctorData.experience) : 0,
        appointmentFee: Number(doctorData.appointmentFee),
        qualifications: doctorData.qualifications,
        currentlyWorkingAt: doctorData.currentlyWorkingAt,
        designation: doctorData.designation,
        profilePhoto: doctorData.profilePhoto || null,
        userId: user.id,
        gender: genderValue,
      },
    });

    return { user, doctor };
  });

  return result;
};
//
// admin create admin (admin only)
const createAdmin = async (req: Request) => {
  if (req.file) {
    const uploaded = await fileUploader.uploadToCloudinary(req.file);
    if (!req.body.admin) req.body.admin = {};
    req.body.admin.profilePhoto = uploaded?.secure_url;
  }

  const adminData = req.body.admin || req.body;
  const adminEmail = adminData.email || req.body.email;
  const password = req.body.password || adminData.password;

  if (!adminEmail || !password) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      "Admin email and password are required",
    );
  }

  const existingEmail = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  });
  if (existingEmail) {
    throw new ApiErrorHandler(httpStatus.CONFLICT, "Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tnx: any) => {
    const user = await tnx.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        UserRole: "ADMIN",
      },
    });

    const admin = await tnx.admin.create({
      data: {
        name: adminData.name,
        email: adminEmail,
        profilePhoto: adminData.profilePhoto || null,
        contactNumber: adminData.contactNumber || null,
        password: hashedPassword,
        userId: user.id,
      },
    });

    return { user, admin };
  });

  return result;
};
//
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

const getMyProfile = async (user: IJWTPayload) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
      status: UserStatus.ACTIVE,
    },
    //profile e ja ja dkhte chai ta ekdom constant daua hoi hosse select use kre
    select: {
      id: true,
      email: true,
      needPasswordChange: true,
      role: true,
      status: true,
    },
  });
};
export const UserService = {
  createPatient,
  getAllFromDB,
  createAdmin,
  createDoctor,
};
