import { Request } from "express";
import { prisma } from "../../shared/prisma";
import { createPatientPayload } from "./user.interface";
import bcrypt from "bcryptjs";
import { fileUploader } from "../../Helper/FileUploader";
const cretePatient = async (req: Request) => {
  if (req.file) {
    const uploadedResult = await fileUploader.uploadToCloudinary(req.file);
    console.log(uploadedResult);
  }
  // const hashPassword = await bcrypt.hash(req.body.password, 10);

  // // for multipple query we can use transaction
  // const result = await prisma.$transaction(async (tnx) => {
  //   // 1️⃣ Create User
  //   const user = await tnx.user.create({
  //     data: {
  //       email: req.body.email,
  //       password: hashPassword,
  //     },
  //   });
  //   return await tnx.patient.create({
  //     data: {
  //       name: req.body.name,
  //       email: req.body.email,
  //       password: req.body.password,
  //       age: req.body.age,
  //       address: req.body.address,
  //       gender: req.body.gender,
  //       userId: user.id, // relation connect
  //     },
  //   });
  // });

  // return result;
};

export const UserService = {
  cretePatient,
};
