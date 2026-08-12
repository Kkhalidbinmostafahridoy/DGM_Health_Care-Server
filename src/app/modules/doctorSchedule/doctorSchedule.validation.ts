import z from "zod";

const createDoctorSCheduleValidationSchema = z.object({
  body: z.object({
    scheduleIds: z
      .array(z.string().uuid())
      .nonempty("Schedule Ids are required"),
  }),
});
export const doctorScheduleValidation = {
  createDoctorSCheduleValidationSchema,
};
