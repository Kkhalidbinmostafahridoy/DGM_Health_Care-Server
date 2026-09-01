import { prisma } from "../../shared/prisma";
import { IJWTPayload } from "../../types/common";
import httpStatus from "http-status";

const insertIntoDB = async (payload: any, user?: IJWTPayload) => {
  const patientData = await prisma.findUniqueOrThrow({
    where: {
      id: user?.userId,
    },
  });
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: payload.appointmentId,
    },
  });
  if (!(patientData.id === appointmentData.patientId)) {
    throw new Error(httpStatus.BAD_REQUEST + "this is not your appointment");
  }
};
export const ReviewService = {
  insertIntoDB,
};
