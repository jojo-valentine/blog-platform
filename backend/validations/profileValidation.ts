import { z } from "zod";
const fields = {
  display_name: z.string().min(1, "Display name is required"),
  age: z.coerce.number().min(0).max(120).optional().nullable(),
  linkAccounts: z
    .array(
      z.union([
        z.string().url(),
        z.object({
          platform: z.string().optional(),
          url: z.string().url(),
        }),
      ]),
    )
    .optional()
    .transform((links) =>
      links?.map((item) => {
        if (typeof item === "string") {
          return {
            platform: "unknown",
            url: item,
          };
        }
        return item;
      }),
    ),
};
export const profileSchemas = {
  update: z
    .object({
      display_name: fields.display_name.optional(),
      age: fields.age,
      linkAccounts: fields.linkAccounts,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
  avatar: z.object({ avatar: z.string().min(1, "Avatar path is required") }),
};
