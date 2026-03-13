import z from "zod";

const createPatientZodValidationSchema = z.object({
  password: z.string(),
  patient: z.object({
    name: z.string({
      error: "Name is required",
    }),
    email: z.string({
      error: "Email is required",
    }),
    age: z.number({
      error: "Age is required",
    }),
    address: z.string({
      error: "Address is required",
    }),
    gender: z.enum(["Male", "Female"], {
      error: "required gender value",
    }),
    profilePhoto: z.string().optional(),
  }),
});

export const UserValidation = {
  createPatientZodValidationSchema,
};
