import { Patient, Prisma, UserStatus } from "@prisma/client";

import { paginationHelper } from "../../Helper/paginationHelper";
import { IPaginationOptions } from "../../interface/IPagination";
import { IPatientFilterRequest, IPatientUpdate } from "./patient.interface";
import { patientSearchableFields } from "./patient.constant";
import { prisma } from "../../shared/prisma";

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
  const { patientHealthData, medicalReport, ...patientData } = payload;

  const patientInfo = await prisma.patient.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
    },
  });

  await prisma.$transaction(async (transactionClient: any) => {
    // Update patient data
    await transactionClient.patient.update({
      where: {
        id,
      },
      data: patientData,
    });

    // Create or update patient health data
    if (patientHealthData) {
      await transactionClient.patientHealthData.upsert({
        where: {
          patientId: patientInfo.id,
        },
        update: patientHealthData,
        create: {
          ...patientHealthData,
          patientId: patientInfo.id,
        },
      });
    }

    // Create medical report
    if (medicalReport) {
      await transactionClient.medicalReport.create({
        data: {
          ...medicalReport,
          patientId: patientInfo.id,
        },
      });
    }
  });

  const responseData = await prisma.patient.findUnique({
    where: {
      id: patientInfo.id,
    },

    include: {
      medicalReports: true,
    },
  });

  return responseData;
};

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
