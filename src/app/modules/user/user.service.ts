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

const getAllFromDB = async (params: {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const { page = 1, limit = 10, searchTerm, sortBy, sortOrder } = params;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // Build dynamic where conditions
  const whereConditions = searchTerm
    ? {
        OR: [
          { email: { contains: searchTerm, mode: "insensitive" as const } },
          {
            patient: {
              name: { contains: searchTerm, mode: "insensitive" as const },
            },
          },
        ],
      }
    : {};

  // Build dynamic sorting
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
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

export const UserService = {
  cretePatient,
  getAllFromDB,
};
