import { Request } from "express";
import { prisma } from "../../shared/prisma";
import bcrypt from "bcryptjs";
import { fileUploader } from "../../Helper/FileUploader";
import { email } from "zod";
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

const getAllFromDB = async ({
  page,
  limit,
  searchTerm,
  sortBy,
  sortOrder,
}: {
  page: number;
  limit: number;
  searchTerm: any;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const pageNumber = page || 1;
  const pageSize = limit || 10;
  const skip = (pageNumber - 1) * pageSize;
  const result = await prisma.user.findMany({
    skip,
    take: pageSize,
    include: {
      patient: true,
    },
    where: {
      email: {
        contains: searchTerm,
        mode: "insensitive",
      },
    },
    orderBy:
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });
  return result;
};

export const UserService = {
  cretePatient,
  getAllFromDB,
};
