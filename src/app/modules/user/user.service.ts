import { Request } from "express";
import { prisma } from "../../shared/prisma";
import bcrypt from "bcryptjs";
import { fileUploader } from "../../Helper/FileUploader";
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

const getAdmin = async () => {
  const result = await prisma.user.findMany({
    where: {
      role: "admin",
    },
  });
  return result;
};

const getAllFromDB = async ({
  page,
  limit,
  searchTerm,
}: {
  page: number;
  limit: number;
  searchTerm: string;
}) => {
  const skip = (page - 1) * limit;
  const result = await prisma.user.findMany({
    skip,
    take: limit,
    where: {
      email: {
        contains: searchTerm,
        mode: "insensitive",
      },
    },
  });
  return result;
};
const getDoctor = async () => {
  const result = await prisma.user.findMany({
    where: {
      role: "doctor",
    },
  });
  return result;
};

export const UserService = {
  cretePatient,
  getAllFromDB,
  getDoctor,
  getAdmin,
};
