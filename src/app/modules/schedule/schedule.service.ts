import { addMinutes, addHours, format } from "date-fns";
import { prisma } from "../../shared/prisma";
import { IOptions, paginationHelper } from "../../Helper/paginationHelper";
import { Prisma } from "@prisma/client/extension";

const insertIntoDB = async (payload: any) => {
  const { startTime, endTime, startDate, endDate } = payload;

  const intervalTime = 30;

  const schedules = [];

  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  while (currentDate <= lastDate) {
    //time format in schedule
    const startDateTime = new Date(
      addMinutes(
        addHours(
          `${format(currentDate, "yyyy-MM-dd")}`,
          Number(startTime.split(":")[0]),
        ),
        Number(startTime.split(":")[1]),
      ),
    );
    const endDateTime = new Date(
      addMinutes(
        addHours(
          `${format(currentDate, "yyyy-MM-dd")}`,
          Number(endTime.split(":")[0]),
        ),
        Number(endTime.split(":")[1]),
      ),
    );
    while (startDateTime < endDateTime) {
      const slotStartDateTime = startDateTime; //10:00
      const slotEndDateTime = addMinutes(startDateTime, intervalTime); //10.30

      const scheduleData = {
        startDateTime: slotStartDateTime,
        endDateTime: slotEndDateTime,
      };
      const existingSchedule = await prisma.schedule.findFirst({
        where: scheduleData,
      });
      if (!existingSchedule) {
        const result = await prisma.schedule.create({
          data: scheduleData,
        });
        schedules.push(result);
      }
      slotStartDateTime.setMinutes(
        slotStartDateTime.getMinutes() + intervalTime,
      );
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedules;
};

const scheduleForDoctor = async (filter: any, option: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(option);
  const { startDateTime: startFilterDTime, endDateTime: endFilterDTime } =
    filter;
  const andConditions: Prisma.ScheduleWhereInput[] = [];

  if (startFilterDTime && endFilterDTime) {
    andConditions.push({
      AND: [
        {
          startDateTime: {
            gte: startFilterDTime,
          },
        },
        {
          endDateTime: {
            lte: endFilterDTime,
          },
        },
      ],
    });
  }

  const whereConditions: Prisma.ScheduleWhereInput =
    andConditions.length > 0
      ? {
          AND: andConditions,
        }
      : {};
  const result = await prisma.schedule.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });
  const total = await prisma.schedule.count({
    where: whereConditions,
  });
  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const deleteScheduleFromDb = async (id: string) => {
  return await prisma.schedule.delete({
    where: {
      id: id,
    },
  });
};
export const scheduleService = {
  insertIntoDB,
  scheduleForDoctor,
  deleteScheduleFromDb,
};
