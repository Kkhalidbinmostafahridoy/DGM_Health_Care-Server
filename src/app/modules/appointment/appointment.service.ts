import { prisma } from "../../shared/prisma";
import { IJWTPayload } from "../../types/common";
import { v4 as uuidv4 } from "uuid";
import { stripe } from "../../Helper/stripe";
import { IOptions, paginationHelper } from "../../Helper/paginationHelper";
import { AppointmentStatus, Prisma, UserRole } from ".prisma/client";
import httpStatus from "http-status";
import ApiErrorHandler from "../../error/apiErrorHandler";

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

    const transactionId = uuidv4();
    const paymentData = await tnx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: ["card"],
      customer_email: user.email,

      line_items: [
        {
          price_data: {
            currency: "BDT",
            product_data: {
              name: `Doctor Appointment - ${doctorData.name}`,
            },
            unit_amount: doctorData.appointmentFee * 100,
          },
          quantity: 1,
        },
      ],

      metadata: {
        appointmentId: appointmentData.id,
        patientId: patientData.patient.id,
        doctorId: doctorData.id,
        paymentId: paymentData.id,
      },

      success_url: `https://github.com/Kkhalidbinmostafahridoy`,

      cancel_url: `https://docs.stripe.com/checkout/quickstart`,
    });

    return { payment_Url: session.url };
  });
  return result;
};

const getMyAppointments = async (
  user: IJWTPayload,
  filters: any,
  option: IOptions,
) => {
  const { page, limit, sortBy, sortOrder, skip } =
    paginationHelper.calculatePagination(option);
  const { ...filterData } = filters;

  const andConditions: Prisma.AppointmentWhereInput[] = [];

  if (user.role === UserRole.PATIENT) {
    andConditions.push({
      patient: {
        email: user.email,
      },
    });
  } else if (user.role === UserRole.DOCTOR) {
    andConditions.push({
      doctor: {
        email: user.email,
      },
    });
  }
  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as any)[key],
      },
    }));

    andConditions.push(...filterConditions);
  }
  const whereConditions: Prisma.AppointmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const result = await prisma.appointment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include:
      user.role === UserRole.DOCTOR ? { patient: true } : { doctor: true },
  });
  const total = await prisma.appointment.count({
    where: whereConditions,
  });
  return {
    meta: {
      total,
      limit,
      page,
    },
    data: result,
  };
};
const UpdateAppointmentStatus = async (
  appointmentId: string,
  status: AppointmentStatus,
  user: IJWTPayload,
) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
    },
    include: {
      doctor: true,
    },
  });

  if (user.role === UserRole.DOCTOR) {
    if (!(user.email === appointmentData.doctor.email))
      throw new ApiErrorHandler(
        httpStatus.BAD_REQUEST,
        "this is not your appointment",
      );
  }
  return await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status,
    },
  });
};
export const appointmentService = {
  createAppointment,
  getMyAppointments,
  UpdateAppointmentStatus,
};
