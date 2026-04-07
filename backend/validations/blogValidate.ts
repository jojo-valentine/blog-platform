import { title } from "node:process";
import { z } from "zod";

const fields = {
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  tags: z // ✅ parse JSON string → array
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [];
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    })
    .pipe(z.array(z.string()).optional()),
  online: z // ✅ coerce string "true"/"false" → boolean
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
};

export const blogSchemas = {
  create: z.object({
    title: fields.title,
    content: fields.content,
    tags: fields.tags,
    online: fields.online,
  }),

  update: z.object({
    title: fields.title.optional(),
    content: fields.content.optional(),
    tags: fields.tags,
    online: fields.online,
  }),

  toggleBlog: z.object({
    // online: fields.online,
    // online: z.enum(["true", "false"]),
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId"),
  }),

  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId"), // ✅ MongoDB ObjectId
  }),
};
