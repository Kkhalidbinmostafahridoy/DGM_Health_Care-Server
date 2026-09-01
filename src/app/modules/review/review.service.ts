import { prisma } from "../../shared/prisma";
import { IJWTPayload } from "../../types/common";
import httpStatus from "http-status";

const insertIntoDB = async (payload: any, user?: IJWTPayload) => {
  const patientData = await prisma.patient.findFirstOrThrow({
    where: {
      userId: user?.userId,
      email: user?.email,
    },
  });
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: payload.appointmentId,
    },
  });
  if (patientData.id !== appointmentData.patientId) {
    throw new Error(`${httpStatus.BAD_REQUEST} this is not your appointment`);
  }

  return await prisma.$transaction(async (tnx: any) => {
    const result = await tnx.review.create({
      data: {
        appointmentId: appointmentData.id,
        doctorId: appointmentData.doctorId,
        patientId: appointmentData.patientId,
        rating: payload.rating,
        comment: payload.comment,
      },
    });

    const avgRating = await tnx.review.aggregate({
      _avg: {
        rating: true,
      },
      where: {
        doctorId: appointmentData.doctorId,
      },
    });
    await tnx.doctor.update({
      where: {
        id: appointmentData.doctorId,
      },
      data: {
        averageRating: avgRating._avg.rating as number,
      },
    });
    return result;
  });
};
export const ReviewService = {
  insertIntoDB,
};
