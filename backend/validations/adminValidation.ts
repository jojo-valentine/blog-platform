// permissions
import { email, z } from "zod";
import { permissionsList } from "../lib/permission";
const fieldsPermissions = {
  name: z.string().min(1, "Name is required"),
  permissions: z.array(
    z.string().superRefine((value, ctx) => {
      if (!permissionsList.includes(value as any)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid permission: ${value}`,
        });
      }
    }),
  ),
};
const filedUserProfile = {
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .email("Invalid email")
    .refine(
      (val) => {
        const allowedTlds = ["com", "net", "io"];
        const tld = val.split(".").pop()?.toLowerCase();
        return tld !== undefined && allowedTlds.includes(tld);
      },
      { message: "Email must end with .com, .net, or .io" },
    ),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .refine((val) => /[a-z]/.test(val), {
      message: "Password must include a lowercase letter",
    })
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must include an uppercase letter",
    })
    .refine((val) => /\d/.test(val), {
      message: "Password must include a number",
    })
    .refine((val) => /[@$!%*?&]/.test(val), {
      message: "Password must include a special character (@$!%*?&)",
    }),
  password_confirm: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .refine((val) => /[a-z]/.test(val), {
      message: "Password must include a lowercase letter",
    })
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must include an uppercase letter",
    })
    .refine((val) => /\d/.test(val), {
      message: "Password must include a number",
    })
    .refine((val) => /[@$!%*?&]/.test(val), {
      message: "Password must include a special character (@$!%*?&)",
    }),
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .refine((val) => /[a-z]/.test(val), {
      message: "Password must include a lowercase letter",
    })
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must include an uppercase letter",
    })
    .refine((val) => /\d/.test(val), {
      message: "Password must include a number",
    })
    .refine((val) => /[@$!%*?&]/.test(val), {
      message: "Password must include a special character (@$!%*?&)",
    }),
  confirmNewPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .refine((val) => /[a-z]/.test(val), {
      message: "Password must include a lowercase letter",
    })
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must include an uppercase letter",
    })
    .refine((val) => /\d/.test(val), {
      message: "Password must include a number",
    })
    .refine((val) => /[@$!%*?&]/.test(val), {
      message: "Password must include a special character (@$!%*?&)",
    }),
  token: z.string().length(64, "Invalid token format"), // sha256 = 64 chars
  displayName: z.string().min(1, "Display name is required"),
  age: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? undefined : Number(val),
    z.number().min(0).max(120).optional(),
  ),
  socialLinks: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      }
      return value;
    },
    z
      .array(
        z.object({
          platform: z.string().min(1, "Platform is required"), // ✅ ต้องมีค่า
          url: z.string().url("Invalid URL"), // ✅ ต้องเป็น URL
        }),
      )
      .optional()
      .transform((links) =>
        links?.map((item) => ({
          platform: item.platform || "unknown", // fallback ถ้าไม่มีค่า
          url: item.url,
        })),
      ),
  ),
};
export const adminSchemas = {
  update: z.object({
    name: fieldsPermissions.name,
    permissions: fieldsPermissions.permissions,
  }),
};
export const adminSchemasUser = {
  create: z
    .object({
      name: filedUserProfile.name,
      email: filedUserProfile.email,
      mobile: filedUserProfile.mobile,
      display_name: filedUserProfile.displayName,
      age: filedUserProfile.age.optional(),
      social_links: filedUserProfile.socialLinks.optional(),
      password: filedUserProfile.password,
      confirm_password: filedUserProfile.password_confirm,
    })
    .refine((data) => data.password === data.confirm_password, {
      message: "Passwords do not match",
      path: ["confirm_password"],
    }),

  update: z.object({
    name: filedUserProfile.name.optional(),
    mobile: filedUserProfile.mobile.optional(),
    email: filedUserProfile.email.optional(),

    profile: z
      .object({
        display_name: filedUserProfile.displayName.optional(),
        age: filedUserProfile.age.optional(),
        social_links: filedUserProfile.socialLinks.optional(),
      })
      .optional(),
  }),
  changPassword: z
    .object({
      password: filedUserProfile.password,
      confirm_password: filedUserProfile.password_confirm,
    })
    .refine((data) => data.password === data.confirm_password, {
      message: "Passwords do not match",
      path: ["confirm_password"],
    }),
};
