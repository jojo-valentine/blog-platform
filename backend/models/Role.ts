import mongoose, { Schema, Document } from "mongoose";
import { IRole } from "../types/role";

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true },
    permissions: [{ type: String }],
    show: { type: Boolean, default: true }, // เปิด/ปิดการแสดงผล
    deletedAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);

export const Role = mongoose.model<IRole>("Role", RoleSchema);
