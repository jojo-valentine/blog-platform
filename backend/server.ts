// server.ts
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import apiRoutes from "./routes/api";
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.1.39:3000",
  "http://192.168.1.36:3000",
];
app.use(
  cors({
    origin: (origin: any, callback: any) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
// ใช้ routes
app.use("/api", apiRoutes);

// เชื่อมต่อ DB ก่อนเปิด server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
});

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from Mongoose setup" });
});
