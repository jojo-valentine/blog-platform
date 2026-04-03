import { z } from "zod";

export const blogSchemas = {
  create: {
    body: z.object({
      title: z.string().min(1, "Title is required"),
      content: z.string().min(1, "Content is required"),
    }),
  },

  update: {
    body: z.object({
      title: z.string().optional(),
      content: z.string().optional(),
    }),

    params: z.object({
      id: z.string().uuid("Invalid blog id"),
    }),
  },

  getById: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
};