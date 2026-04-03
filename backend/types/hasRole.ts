import mongoose, { Document, Schema, model } from "mongoose";

export interface IHasRole extends Document {
  role_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  resource: string; // เช่น "Blog", "Image", "User"
}

