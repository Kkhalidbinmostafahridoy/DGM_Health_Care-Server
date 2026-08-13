import { z } from "zod";

const create = z.object({
  title: z.string().min(1, "Title is required!"),
  name: z.string().min(1, "Name is required!"),
  description: z.string().optional(),
});

export const SpecialtiesValidation = {
  create,
};
