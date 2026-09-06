import { IJWTPayload } from "../../types/common";
import { NextFunction } from "express";
import { metaDataController } from "./meta.controller";
import { PaymentStatus, UserRole } from "@prisma/client";
import ApiErrorHandler from "../../error/apiErrorHandler";
import httpStatus, { status } from "http-status";
import { prisma } from "../../shared/prisma";

const fetchDashboardMetaData = async (user: IJWTPayload) => {
  let metaData;
  switch (user.role) {
    case UserRole.ADMIN:
      metaData = await getAdminMetaData();
      break;
    case UserRole.DOCTOR:
      metaData = await getAdminMetaData();
      break;
    case UserRole.PATIENT:
      metaData = await getAdminMetaData();
      break;
    default:
      throw new ApiErrorHandler(httpStatus.BAD_REQUEST, "invalid user role!");
  }
  return metaData;
};

const getAdminMetaData = async () => {
  const patientCount = await prisma.patient.count();
  const doctorCount = await prisma.doctor.count();
  const adminCount = await prisma.admin.count();
  const appointmentCount = await prisma.appointment.count();
  const prescriptionCount = await prisma.prescription.count();
  const paymentCount = await prisma.payment.count();
  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: PaymentStatus.PAID,
    },
  });

  const barChartData = await getBarChartData();
  const pieChartData = await getPieChartData();

  return {
    patientCount,
    doctorCount,
    adminCount,
    appointmentCount,
    prescriptionCount,
    paymentCount,
    totalRevenue,
    barChartData,
    pieChartData,
  };
};

const getBarChartData = async () => {
  const appointmentCountPerMonth = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month',"createdAt") As month,
        CAST(COUNT(*)AS INTEGER) AS COUNT
        FROM "appointments"
        GROUP BY month
        ORDER BY month ASC
    `;
  return appointmentCountPerMonth;
};
const getPieChartData = async () => {
  const appointmentStatusDistribution = await prisma.appointment.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const formattedAppointmentStatusDistribution =
    appointmentStatusDistribution.map(({ status, _count }: any) => ({
      status,
      _count: Number(_count.id),
    }));
  return formattedAppointmentStatusDistribution;
};
export const metaDataService = {
  fetchDashboardMetaData,
};
