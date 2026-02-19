import { prisma } from "../../shared/prisma";
import { createPatientPayload } from "./user.interface";
import bcrypt from "bcryptjs";

const createPatient = async (payload: createPatientPayload) => {
  const hashPassword = await bcrypt.hash(payload.password, 10);

  const result = await prisma.$transaction(async (tnx) => {
    await tnx.user.create({
      data: {
        email: payload.email,
        password: hashPassword,
      },
    });
    await tnx.patient.create({
      data: {
        name: payload.name,
        email: payload.email,
        password:
      },
    });
  });
};

export const UserService = {
  createPatient,
};
