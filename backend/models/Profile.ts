// models/Profile.ts
import mongoose, { Schema, Document } from "mongoose";
import { IProfile } from "../types/profile";
const ProfileSchema = new Schema<IProfile>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    display_name: { type: String, required: true },
    age: { type: String, default: null },
    avatar: { type: String, default: null },

    social_links: [
      {
        platform: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

export const Profile = mongoose.model<IProfile>("Profile", ProfileSchema);
