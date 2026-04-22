import { email, z } from "zod";
const fields = {
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
};

export const authSchemas = {
  register: z.object({
    name: fields.name,
    email: fields.email,
    mobile: fields.mobile,
    password: fields.password,
  }),
  login: z.object({
    email: fields.email,
    password: fields.password,
  }),
  update_reset_password: z
    .object({
      token: z.string().min(1, "Token is required"),
      password: fields.password,
      password_confirm: fields.password_confirm,
    })
    .refine((data) => data.password === data.password_confirm, {
      message: "Passwords do not match",
      path: ["password_confirm"],
    }),
  update_chang_password: z.object({
    email: fields.email,
  }),
  update_new_password: z
    .object({
      password: fields.password,
      newPassword: fields.newPassword,
      confirmNewPassword: fields.confirmNewPassword,
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Passwords do not match",
      path: ["confirmNewPassword"],
    }),
  update_new_email: z.object({
    otp: z.string().min(1, "OTP is required").max(6, "OTP MAX 6 "),
  }),
};

// type SchemaName = keyof typeof schemas;

// const validate =
