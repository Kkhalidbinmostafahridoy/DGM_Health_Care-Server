// import { prisma } from "../../shared/prisma";
// import { createPatientPayload } from "./user.interface";
// import bcrypt from "bcryptjs";

// const createPatient = async (payload: createPatientPayload) => {
//   const hashPassword = await bcrypt.hash(payload.password, 10);

//   const result = await prisma.$transaction(async (tnx) => {
//     // 1️⃣ Create User
//     const user = await tnx.user.create({
//       data: {
//         email: payload.email,
//         password: hashPassword,
//       },
//     });

//     console.log("User created:", user);
//     // 2️⃣ Create Patient
//     const patient = await tnx.patient.create({
//       data: {
//         name: payload.name,
//         email: payload.email,
//         password: hashPassword,
//         age: payload.age,
//         userId: user.id, // relation connect
//       },
//     });

//     return patient; // ✅ IMPORTANT
//   });

//   return result;
// };

// export const UserService = {
//   createPatient,
// };

import { prisma } from "../../shared/prisma";
import { createPatientPayload } from "./user.interface";
import bcrypt from "bcryptjs";
const cretePatient = async (payload: createPatientPayload) => {
  const hashPassword = await bcrypt.hash(payload.password, 10);

  // for multipple query we can use transaction
  const result = await prisma.$transaction(async (tnx) => {
    // 1️⃣ Create User
    const user = await tnx.user.create({
      data: {
        email: payload.email,
        password: hashPassword,
      },
    });
    return await tnx.patient.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        age: payload.age,
        address: payload.address,
        gender: payload.gender,
        userId: user.id, // relation connect
      },
    });
  });

  return result;
};

export const UserService = {
  cretePatient,
};
