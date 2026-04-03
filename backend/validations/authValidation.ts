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
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
      "Password must be strong",
    )
    .min(6, "Password must be at least 6 characters"),

  newPassword: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
      "Password must be strong",
    )
    .min(6, "Password must be at least 6 characters"),
  confirmNewPassword: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
      "Password must be strong",
    )
    .min(6, "Password must be at least 6 characters"),
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
  update_reset_password: z.object({
    otp: z.string().min(1, "OTP is required"),
    token: z.string().min(1, "Token is required"),
    password: fields.password,
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
