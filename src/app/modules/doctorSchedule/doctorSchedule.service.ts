import { Request, Response } from "express";
import { prisma } from "../../shared/prisma";
import { IJWTPayload } from "../../types/common";

const insertIntoDB = async (
  user: IJWTPayload,
  payload: {
    scheduleIds: string[];
  },
) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
      userId: user.userId,
    },
  });
  console.log("USER:", user);
  console.log("EMAIL:", user.email);
  console.log("USER ID:", user.userId);

  const doctorScheduleData = payload.scheduleIds.map((scheduleId) => ({
    doctorId: doctorData.id,
    scheduleId,
  }));
  return await prisma.doctorSchedule.createMany({
    data: doctorScheduleData,
    skipDuplicates: true,
  });
};

const UpdateDoctorSchedule = async (
  user: IJWTPayload,
  payload: { scheduleIds: string },
) => {
  const doctorData = await prisma.doctor.update({
    where: {
      id: user.userId,
    },
  });
  return await prisma.doctorSchedule.update({
    where: {
      doctorId: user.userId,
    },
    data: {
      scheduleId: payload.scheduleIds,
    },
  });
};

const deleteDoctorSchedule = async (user: IJWTPayload) => {
  return await prisma.doctorSchedule.deleteMany({
    where: {
      doctorId: user.userId,
    },
  });
};

export const doctorScheduleService = {
  insertIntoDB,
  UpdateDoctorSchedule,
  deleteDoctorSchedule,
};
