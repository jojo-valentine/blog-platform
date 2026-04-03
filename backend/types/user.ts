import { IHasRole } from "./hasRole";
import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: mongoose.Types.ObjectId;
  verifyAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
