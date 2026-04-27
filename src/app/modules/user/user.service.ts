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

const getAllFromDB = async (param: any, options: any) => {
  const { page, limit, sortBy, sortOrder, skip, take } =
    paginationHelper.calculatePagination(options);

  const pageNumber = Number(options.page) || 1;
  const limitNumber = Number(options.limit) || 10;

  const searchTerm = param.searchTerm || "";
  const sortBy = param.sortBy || "";
  const sortOrder = param.sortOrder || "desc";

  const skip = (pageNumber - 1) * limitNumber;
  const take = limitNumber;

  const whereConditions = searchTerm
    ? {
        OR: [
          { email: { contains: searchTerm, mode: "insensitive" as const } },
          { status: param.status },
          { UserRole: param.UserRole },
          {
            patient: {
              name: { contains: searchTerm, mode: "insensitive" as const },
            },
          },
        ],
      }
    : {};

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
      page: pageNumber,
      limit: limitNumber,
      total,
    },
    data: result,
  };
};
export const UserService = {
  cretePatient,
  getAllFromDB,
};
