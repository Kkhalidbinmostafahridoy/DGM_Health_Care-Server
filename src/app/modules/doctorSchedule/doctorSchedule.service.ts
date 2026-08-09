import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { prisma } from "../../shared/prisma";

const insertIntoDB = async (
  user: any,
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

  const doctorScheduleData = payload.scheduleIds.map((scheduleId) => ({
    doctorId: doctorData.id,
    scheduleId,
  }));
  return await prisma.doctorSchedule.createMany({
    data: doctorScheduleData,
    skipDuplicates: true,
  });
  console.log(doctorScheduleData, "doctorScheduleData");
  return {
    user,
    payload,
    doctorScheduleData,
  };
};

export const doctorScheduleService = {
  insertIntoDB,
};
