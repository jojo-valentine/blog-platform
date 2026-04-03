import mongoose, { Document, Schema, model } from "mongoose";
import { IHasRole } from "../types/hasRole";

const HasRoleSchema = new Schema<IHasRole>(
  {
    role_id: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resource: { type: String, required: true },
  },
  { timestamps: true },
);

// ป้องกันการซ้ำ: user_id + role_id + model ต้อง unique
HasRoleSchema.index(
  { user_id: 1, role_id: 1, model: 1, resource: 1 },
  { unique: true },
);

export const HasRole = model<IHasRole>("HasRole", HasRoleSchema);
