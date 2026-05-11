import { z } from "zod";
const fields = {
  name: z.string().min(1, "Name is required"),
};
export const categorySchemas = {
  create: z.object({
    name: fields.name,
  }),
  update: z.object({
    name: fields.name,
  }),
};
