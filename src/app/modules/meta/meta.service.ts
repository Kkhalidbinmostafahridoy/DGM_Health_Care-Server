import { IJWTPayload } from "../../types/common";
import { NextFunction } from "express";
import { metaDataController } from "./meta.controller";
import { PaymentStatus, UserRole } from "@prisma/client";
import ApiErrorHandler from "../../error/apiErrorHandler";
import httpStatus from "http-status";
import { prisma } from "../../shared/prisma";

const fetchDashboardMetaData = async (user: IJWTPayload) => {
  let metaData;
  switch (user.role) {
    case UserRole.ADMIN:
      metaData = "Admin metadata";
      break;
    case UserRole.DOCTOR:
      metaData = "Doctor metadata";
      break;
    case UserRole.PATIENT:
      metaData = "Patient metadata";
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
      PaymentStatus: PaymentStatus.PAID,
    },
  });
};

const getBarChartData = async () => {
  const appointmentCountPerMonth = await prisma.appointment.$queryRaw`
        SELECT DATE_TRUNC('month',"createdAt") As month
    `;
};
export const metaDataService = {
  fetchDashboardMetaData,
};
