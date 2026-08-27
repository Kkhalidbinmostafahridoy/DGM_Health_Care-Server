import {
  AppointmentStatus,
  PaymentStatus,
  Prescription,
  UserRole,
} from "@prisma/client";
import { IJWTPayload } from "../../types/common";
import { prisma } from "../../shared/prisma";
import ApiErrorHandler from "../../error/apiErrorHandler";
import httpStatus from "http-status";

const createPrescription = async (
  user: IJWTPayload,
  payload: Partial<Prescription>,
) => {
  console.log(createPrescription);
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: payload.appointmentId,
      status: AppointmentStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
    },
    include: {
      doctor: true,
    },
  });
  if (user.role === UserRole.DOCTOR) {
    if (!(user.email === appointmentData.doctor.email))
      throw new ApiErrorHandler(
        httpStatus.BAD_REQUEST,
        "this is not your prescription",
      );
  }
  const result = await prisma.prescription.create({
    data: {
      appointmentId: appointmentData.id,
      doctorId: appointmentData.doctorId,
      patientId: appointmentData.patientId,
      instruction: payload.instruction,
      followUpdates: payload.followUpdates ?? null,
    },
    include: {
      patient: true,
    },
  });
  return result;
};
export const prescriptionService = {
  createPrescription,
};
