import { email } from "zod";
import { prisma } from "../../shared/prisma";
import { IJWTPayload } from "../../types/common";
import { v4 as uuidv4 } from "uuid";

// const createAppointment = async (
//   user: IJWTPayload,
//   payload: { doctorId: string; scheduleId: string },
// ) => {
//   console.log("JWT USER:", user);
//   console.log("userId:", user?.userId);
//   console.log("email:", user?.email);
//   const patientData = await prisma.user.findUniqueOrThrow({
//     where: {
//       email: user.email,
//       id: user.userId,
//     },
//   });

//   const doctorData = await prisma.doctor.findUniqueOrThrow({
//     where: {
//       id: payload.doctorId,
//       isDeleted: false,
//     },
//   });
//   const isBookedOrNot = await prisma.doctorSchedules.findUniqueOrThrow({
//     where: {
//       doctorId: payload.doctorId,
//       scheduleId: payload.scheduleId,
//       isBooked: false,
//     },
//   });

//   const videoCallingId = uuidv4();
//   console.log({
//     patientId: patientData.id,
//     doctorId: doctorData.id,
//     scheduleId: payload.scheduleId,
//     videoCallingId,
//   });
// };
const createAppointment = async (
  user: IJWTPayload,
  payload: { doctorId: string; scheduleId: string },
) => {
  if (!user?.userId) {
    throw new Error("User ID is missing from JWT payload");
  }

  const patientData = await prisma.user.findUniqueOrThrow({
    where: {
      id: user.userId,
    },
    include: {
      patient: true,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });

  const scheduleData = await prisma.doctorSchedule.findFirst({
    where: {
      doctorId: payload.doctorId,
      scheduleId: payload.scheduleId,
      isBooked: false,
    },
  });

  if (!scheduleData) {
    throw new Error("This doctor schedule is already booked or unavailable");
  }

  const videoCallingId = uuidv4();

  const result = await prisma.$transaction(async (tnx: any) => {
    if (!patientData.patient) {
      throw new Error("Patient profile not found");
    }

    const appointmentData = await tnx.appointment.create({
      data: {
        patientId: patientData.patient.id,
        doctorId: doctorData.id,
        scheduleId: payload.scheduleId,
        videoCallingId,
      },
    });

    await tnx.doctorSchedule.update({
      where: {
        doctorId_scheduleId: {
          doctorId: doctorData.id,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    return appointmentData;
  });
  return result;
};
export const appointmentService = {
  createAppointment,
};
