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
    age: z.coerce.number({
      message: "Age is required and must be a number",
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

const createAdminZodValidationSchema = z.object({
  password: z.string(),
  admin: z.object({
    name: z.string({
      error: "Name is required",
    }),
    email: z.string({
      error: "Email is required",
    }),
    profilePhoto: z.string().optional(),
  }),
});

export const UserValidation = {
  createPatientZodValidationSchema,
  createAdminZodValidationSchema,
};
