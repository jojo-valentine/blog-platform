// permissions
import { email, z } from "zod";
import { permissionsList } from "../lib/permission";
const fields = {
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
export const adminSchemas = {
  update: z.object({
    name: fields.name,
    permissions: fields.permissions,
  }),
};
