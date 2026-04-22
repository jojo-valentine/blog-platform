import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ResetToken } from "../models";
import { hex, string } from "zod";
import { ClientSession } from "mongoose";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES_DAYS = 7;

const tokenServices = {
  generateAccessToken(userId: string) {
    return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
  },

  async generateRefreshToken(userId: string, session?: ClientSession) {
    const rawToken = crypto.randomBytes(64).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

    await ResetToken.create(
      [
        {
          user_id: userId,
          token: hashedToken,
          expiresAt,
        },
      ],
      { session },
    );

    return rawToken;
  },

  // ตรวจสอบ refresh token แล้วออก access token ใหม่
  async rotateRefreshToken(oldToken: string) {
    const stored = await ResetToken.findOne({ token: oldToken });
    if (!stored) {
      throw new Error("Invalid refresh token");
    }
    if (stored.expiresAt < new Date()) {
      await ResetToken.deleteOne({ token: oldToken });
      throw new Error("Refresh token expired");
    }
    await ResetToken.deleteOne({ token: oldToken });
    const newRefreshToken = await this.generateRefreshToken(
      stored.user_id.toString(),
    );
    const newAccessToken = this.generateAccessToken(stored.user_id.toString());

    return { newAccessToken, newRefreshToken };
  },

  async revokeRefreshToken(token: string) {
    await ResetToken.deleteOne({ token });
  },
};
export default tokenServices;
