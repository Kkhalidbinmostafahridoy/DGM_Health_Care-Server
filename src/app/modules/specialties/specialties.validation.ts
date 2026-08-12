import { z } from "zod";

const create = z.object({
  title: z.string({
    error: "Title is required!",
  }),
});

export const SpecialtiesValidation = {
  create,
};
