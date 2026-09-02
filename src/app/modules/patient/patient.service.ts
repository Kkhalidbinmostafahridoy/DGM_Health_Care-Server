import { Patient, Prisma, UserStatus } from "@prisma/client";

import { paginationHelper } from "../../Helper/paginationHelper";
import { IPaginationOptions } from "../../interface/IPagination";
import { IPatientFilterRequest, IPatientUpdate } from "./patient.interface";
import { patientSearchableFields } from "./patient.constant";
import { prisma } from "../../shared/prisma";
import { IJWTPayload } from "../../types/common";

const getAllFromDB = async (
  filters: IPatientFilterRequest,
  options: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.PatientWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: patientSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  andConditions.push({
    isDeleted: false,
  });

  const whereConditions: Prisma.PatientWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.patient.findMany({
    where: whereConditions,
    skip,
    take: limit,

    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },

    include: {
      medicalReports: true,
    },
  });

  const total = await prisma.patient.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const getByIdFromDB = async (id: string): Promise<Patient | null> => {
  const result = await prisma.patient.findUnique({
    where: {
      id,
      isDeleted: false,
    },

    include: {
      medicalReports: true,
    },
  });

  return result;
};

const updateIntoDB = async (
  id: string,
  payload: Partial<IPatientUpdate>,
): Promise<Patient | null> => {
  const {
    patientHealthData,
    PatientHealthData,
    medicalReport,
    ...patientData
  } = payload as any;

  // Support both:
  // patientHealthData
  // PatientHealthData
  const healthData = patientHealthData || PatientHealthData;

  // ==========================================
  // Find Patient
  // ==========================================

  const patientInfo = await prisma.patient.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
    },
  });

  // ==========================================
  // Parse Date
  // DD-MM-YYYY -> Date
  // ==========================================

  const parseDateOfBirth = (date: string | Date): Date => {
    if (date instanceof Date) {
      return date;
    }

    const value = String(date).trim();

    // DD-MM-YYYY
    const parts = value.split("-");

    if (parts.length === 3) {
      const [day, month, year] = parts;

      return new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(
          2,
          "0",
        )}T00:00:00.000Z`,
      );
    }

    return new Date(value);
  };

  // ==========================================
  // Parse Gender
  // Prisma enum:
  // Male
  // Female
  // ==========================================

  const parseGender = (gender: string) => {
    const normalizedGender = String(gender).trim().toLowerCase();

    if (normalizedGender === "male") {
      return "Male";
    }

    if (normalizedGender === "female") {
      return "Female";
    }

    throw new Error(`Invalid gender: ${gender}. Expected Male or Female`);
  };

  // ==========================================
  // Parse Boolean
  // Supports:
  // true
  // false
  // "true"
  // "false"
  // ==========================================

  const parseBoolean = (
    value: boolean | string | undefined,
  ): boolean | undefined => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (normalized === "true") {
        return true;
      }

      if (normalized === "false") {
        return false;
      }
    }

    throw new Error(`Invalid boolean value: ${value}. Expected true or false`);
  };

  // ==========================================
  // Parse Height
  //
  // 5'7  -> 170.18 cm
  // 170  -> 170
  // 170cm -> 170
  // ==========================================

  const parseHeight = (height: string | number): number => {
    if (typeof height === "number") {
      return height;
    }

    const value = String(height).trim();

    // Feet + inches
    const feetInchesMatch = value.match(/^(\d+)'(\d+(?:\.\d+)?)"?$/);

    if (feetInchesMatch) {
      const feet = Number(feetInchesMatch[1]);
      const inches = Number(feetInchesMatch[2]);

      return Number((feet * 30.48 + inches * 2.54).toFixed(2));
    }

    // Centimeter
    const cmMatch = value.match(/^(\d+(?:\.\d+)?)\s*cm$/i);

    if (cmMatch) {
      return Number(cmMatch[1]);
    }

    const parsed = Number(value.replace(/[^0-9.]/g, ""));

    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid height: ${height}`);
    }

    return parsed;
  };

  // ==========================================
  // Parse Weight
  //
  // 56KG -> 56
  // ==========================================

  const parseWeight = (weight: string | number): number => {
    if (typeof weight === "number") {
      return weight;
    }

    const parsed = Number(String(weight).replace(/[^0-9.]/g, ""));

    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid weight: ${weight}`);
    }

    return parsed;
  };

  // ==========================================
  // Transaction
  // ==========================================

  await prisma.$transaction(async (transactionClient: any) => {
    // ========================================
    // 1. Update Patient
    // ========================================

    await transactionClient.patient.update({
      where: {
        id,
      },
      data: patientData,
    });

    // ========================================
    // 2. Patient Health Data
    // ========================================

    if (healthData) {
      const existingHealthData =
        await transactionClient.patientHealthData.findFirst({
          where: {
            patientId: patientInfo.id,
          },
        });

      // ======================================
      // Blood Group
      // ======================================

      const bloodGroup = healthData.bloodGroup || healthData.bloodType;

      // ======================================
      // Blood Type
      // ======================================

      const bloodType = healthData.bloodType || healthData.bloodGroup;

      // ======================================
      // Format Health Data
      // ======================================

      const formattedHealthData = {
        // Enum
        ...(healthData.gender !== undefined && {
          gender: parseGender(healthData.gender),
        }),

        // Date
        ...(healthData.dateOfBirth !== undefined && {
          dateOfBirth: parseDateOfBirth(healthData.dateOfBirth),
        }),

        // Blood
        ...(bloodGroup !== undefined && {
          bloodGroup,
        }),

        ...(bloodType !== undefined && {
          bloodType,
        }),

        // Height
        ...(healthData.height !== undefined && {
          height: parseHeight(healthData.height),
        }),

        // Weight
        ...(healthData.weight !== undefined && {
          weight: parseWeight(healthData.weight),
        }),

        // ====================================
        // Boolean Health Fields
        // ====================================

        ...(healthData.hasAllergies !== undefined && {
          hasAllergies: parseBoolean(healthData.hasAllergies),
        }),

        ...(healthData.hasDiabetes !== undefined && {
          hasDiabetes: parseBoolean(healthData.hasDiabetes),
        }),

        ...(healthData.hasHypertension !== undefined && {
          hasHypertension: parseBoolean(healthData.hasHypertension),
        }),

        ...(healthData.smokingStatus !== undefined && {
          smokingStatus: parseBoolean(healthData.smokingStatus),
        }),

        ...(healthData.alcoholConsumption !== undefined && {
          alcoholConsumption: parseBoolean(healthData.alcoholConsumption),
        }),

        ...(healthData.pregnancyStatus !== undefined && {
          pregnancyStatus: parseBoolean(healthData.pregnancyStatus),
        }),

        ...(healthData.hasPastSurgeries !== undefined && {
          hasPastSurgeries: parseBoolean(healthData.hasPastSurgeries),
        }),

        ...(healthData.hasChronicConditions !== undefined && {
          hasChronicConditions: parseBoolean(healthData.hasChronicConditions),
        }),

        ...(healthData.recentAnxietyOrDepressionSymptoms !== undefined && {
          recentAnxietyOrDepressionSymptoms: parseBoolean(
            healthData.recentAnxietyOrDepressionSymptoms,
          ),
        }),

        // ====================================
        // String Fields
        // ====================================

        ...(healthData.dietaryPreferences !== undefined && {
          dietaryPreferences: healthData.dietaryPreferences,
        }),

        ...(healthData.mentalHealthStatus !== undefined && {
          mentalHealthStatus: healthData.mentalHealthStatus,
        }),

        ...(healthData.immunizationStatus !== undefined && {
          immunizationStatus: healthData.immunizationStatus,
        }),

        ...(healthData.recentStressLevels !== undefined && {
          recentStressLevels: healthData.recentStressLevels,
        }),

        ...(healthData.occupation !== undefined && {
          occupation: healthData.occupation,
        }),

        ...(healthData.allergies !== undefined && {
          allergies: healthData.allergies,
        }),

        ...(healthData.medicalHistory !== undefined && {
          medicalHistory: healthData.medicalHistory,
        }),

        // ====================================
        // Marital Status
        // ====================================

        ...(healthData.maritalStatus !== undefined && {
          maritalStatus: healthData.maritalStatus,
        }),
      };

      // ======================================
      // Update Existing Health Data
      // ======================================

      if (existingHealthData) {
        await transactionClient.patientHealthData.update({
          where: {
            id: existingHealthData.id,
          },
          data: formattedHealthData,
        });
      }

      // ======================================
      // Create New Health Data
      // ======================================
      else {
        await transactionClient.patientHealthData.create({
          data: {
            ...formattedHealthData,
            patientId: patientInfo.id,
          },
        });
      }
    }

    // ========================================
    // 3. Medical Report
    // ========================================

    if (medicalReport) {
      await transactionClient.medicalReport.create({
        data: {
          ...medicalReport,
          patientId: patientInfo.id,
        },
      });
    }
  });

  // ==========================================
  // 4. Return Updated Patient
  // ==========================================

  const responseData = await prisma.patient.findUnique({
    where: {
      id: patientInfo.id,
    },
    include: {
      patientHealthData: true,
      medicalReports: true,
    },
  });

  return responseData;
};

// const updateIntoDB = async (payload: any, user: IJWTPayload) => {
//   const { medicalReport, PatientHealthData, ...patientData } = payload;

//   const patientInfo = await prisma.patient.findUniqueOrThrow({
//     where: {
//       email: user.email,

//       idDeleted: false,
//     },
//   });

//   return await prisma.$transaction(async (tnx: any) => {
//     await tnx.patient.update({
//       where: {
//         id: patientInfo.id,
//       },

//       data: patientData,
//     });

//     if (PatientHealthData) {
//       await tnx.PatientHealthData.upsert({
//         where: {
//           patientId: patientInfo.id,
//         },

//         update: PatientHealthData,

//         create: {
//           ...PatientHealthData,

//           patientId: patientInfo.id,
//         },
//       });
//     }

//     if (medicalReport) {
//       await tnx.medicalReport.create({
//         data: {
//           ...medicalReport,

//           patientId: patientInfo.id,
//         },
//       });
//     }

//     const result = await tnx.patient.findUnique({
//       where: {
//         id: patientInfo.id,
//       },
//       include: {
//         PatientHealthData: true,
//         medicalReports: true,
//       },
//     });
//     return result;
//   });
// };

const deleteFromDB = async (id: string): Promise<Patient | null> => {
  const result = await prisma.$transaction(async (tx: any) => {
    // 1. Delete medical reports
    await tx.medicalReport.deleteMany({
      where: {
        patientId: id,
      },
    });

    // 2. Delete patient health data
    await tx.patientHealthData.deleteMany({
      where: {
        patientId: id,
      },
    });

    // 3. Delete payments related to patient's appointments
    await tx.payment.deleteMany({
      where: {
        appointment: {
          patientId: id,
        },
      },
    });

    // 4. Delete appointments
    await tx.appointment.deleteMany({
      where: {
        patientId: id,
      },
    });

    // 5. Delete patient
    const deletedPatient = await tx.patient.delete({
      where: {
        id,
      },
    });

    // 6. Delete associated user
    await tx.user.delete({
      where: {
        email: deletedPatient.email,
      },
    });

    return deletedPatient;
  });

  return result;
};

const softDelete = async (id: string): Promise<Patient | null> => {
  return await prisma.$transaction(async (transactionClient: any) => {
    // Soft delete patient
    const deletedPatient = await transactionClient.patient.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });

    // Update user status
    await transactionClient.user.update({
      where: {
        email: deletedPatient.email,
      },
      data: {
        UserStatus: UserStatus.DELETED,
      },
    });

    return deletedPatient;
  });
};

export const PatientService = {
  getAllFromDB,
  getByIdFromDB,
  updateIntoDB,
  deleteFromDB,
  softDelete,
};
