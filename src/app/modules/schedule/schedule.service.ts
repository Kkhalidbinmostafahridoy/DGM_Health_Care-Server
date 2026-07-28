const insertIntoDB = async (payload: any) => {
  const { startTime, endTime, startDate, endDate } = payload;

  const intervalTime = 30;

  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  while (currentDate <= endDate) {
    const startDateTime = new Date(currentDate);
  }

  console.log({ payload });
  return payload;
};

export const scheduleService = {
  insertIntoDB,
};
