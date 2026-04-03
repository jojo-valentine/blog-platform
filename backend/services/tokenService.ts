import jwt from "jsonwebtoken";
import crypto from "crypto";
import { RefreshToken } from "../models";
import { hex, string } from "zod";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const ACCESS_EXPIRES = "15m";;
const REFRESH_EXPIRES_DAYS = 7;

const tokenServies = {
  generateAccessToken(userId: string) {
    return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
  },

  async generateRefreshToken(userId: string) {
    const token = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

    await RefreshToken.create({ userId, token, expiresAt });
    return token;
  },

  // ตรวจสอบ refresh token แล้วออก access token ใหม่
  async rotateRefreshToken(oldToken: string) {
    const stored = await RefreshToken.findOne({ token: oldToken });
    if (!stored) {
      throw new Error("Invalid refresh token");
    }
    if (stored.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ token: oldToken });
      throw new Error("Refresh token expired");
    }
    await RefreshToken.deleteOne({ token: oldToken });
    const newRefreshToken = await this.generateRefreshToken(
      stored.userId.toString(),
    );
    const newAccessToken = this.generateAccessToken(stored.userId.toString());

    return { newAccessToken, newRefreshToken };
  },

  async revokeRefreshToken(token: string) {
    await RefreshToken.deleteOne({ token });
  },
};
export default tokenServies;
