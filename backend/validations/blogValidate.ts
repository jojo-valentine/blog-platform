import { title } from "node:process";
import { z } from "zod";

const fields = {
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  categories: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return [];
      return typeof val === "string" ? [val] : val;
    }),
  // is_online: z // ✅ coerce string "true"/"false" → boolean
  //   .enum(["true", "false"])
  //   .optional()
  //   .transform((val) => val === "true"),
  is_online: z // ✅ coerce string "true"/"false" → boolean
    .boolean(),
};

export const blogSchemas = {
  create: z.object({
    title: fields.title,
    content: fields.content,
    categories: fields.categories,
    // is_online: fields.is_online,
  }),

  update: z.object({
    title: fields.title.optional(),
    content: fields.content.optional(),
    categories: fields.categories,
    is_online: fields.is_online,
  }),

  toggleBlog: z.object({
    // is_online: fields.online,
    is_online: fields.is_online,
    // id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId"),
  }),

  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId"), // ✅ MongoDB ObjectId
  }),
};
