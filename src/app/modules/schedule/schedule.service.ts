import { addMinutes, addHours, format } from "date-fns";

const insertIntoDB = async (payload: any) => {
  const { startTime, endTime, startDate, endDate } = payload;

  const intervalTime = 30;

  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  while (currentDate <= endDate) {
    //time format in schedule
    const startDateTime = new Date(
      addMinutes(
        addHours(
          `${format(currentDate, "yyyy-mm-dd")}`,
          Number(startTime.split(":")[0]),
        ),
        Number(startTime.split(":")[1]),
      ),
    );
  }

  console.log({ payload });
  return payload;
};

export const scheduleService = {
  insertIntoDB,
};
