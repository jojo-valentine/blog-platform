// models/User.ts
import { Schema, model, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { IUser } from "../types/user";

const UserSchema = new Schema<IUser>(
  {
    // _id: {
    //   type: String,
    //   default: () => uuidv4(),
    // },

    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: { type: String, required: true, unique: true },
    verifyAt: { type: Date, default: null },
    password: {
      type: String,
      required: true,
    },
    // role: { type: String, default: "user" },
  },
  {
    timestamps: true, // auto createdAt, updatedAt
    //_id: false, // ปิด auto ObjectId เพราะใช้ uuid แทน
  },
);
UserSchema.virtual("profile", {
  ref: "Profile",
  localField: "_id",
  foreignField: "user_id",
  justOne: true, // เพราะ 1 user มี 1 profile
});
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });
export const User = model<IUser>("User", UserSchema);
