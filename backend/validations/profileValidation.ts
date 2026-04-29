import { z } from "zod";
const fields = {
  name: z.string().min(1, "Display name is required"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  displayName: z.string().min(1, "Display name is required"),
  age: z.coerce.number().min(0).max(120).optional().nullable(),
  socialLinks: z
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
      // mobile
      name: fields.name,
      display_name: fields.displayName.optional(),
      mobile: fields.mobile,
      age: fields.age,
      social_links: fields.socialLinks,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
  avatar: z.object({ avatar: z.string().min(1, "Avatar path is required") }),
};
