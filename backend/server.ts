// server.ts
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import apiRoutes from "./routes/api";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
// 🔥 port ของ backend (แนะนำใช้ 5000 จะไม่ชน Next.js)

app.use(express.json());
// 👉 รับ request body แบบ JSON
// เช่น axios.post({ name: "jo" })

app.use(express.urlencoded({ extended: true }));
// 👉 รองรับ form submit แบบ x-www-form-urlencoded
// (เช่น form ธรรมดาใน HTML)

app.use(cookieParser());
// 👉 ใช้อ่าน cookie จาก request
// เช่น req.cookies.accessToken

const allowedOrigins = [
  process.env.CLIENT_URL, // 👉 domain จริง (production)
  "http://localhost:3000", // 👉 dev frontend
  "http://192.168.1.39:3000", // 👉 เปิดในมือถือเครื่องเดียวกัน
  "http://192.168.1.36:3000", // 👉 อีกเครื่องใน LAN
];

app.use(
  cors({
    origin: (origin, callback) => {
      // 🔥 ถ้าไม่มี origin (เช่น Postman) → อนุญาต
      if (!origin) return callback(null, true);

      // 🔥 ถ้าอยู่ใน whitelist → อนุญาต
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // ❌ ไม่อนุญาต
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // 🔥 สำคัญมาก (ใช้ cookie ต้องมี)
  })
);
// ใช้ routes
app.use("/api", apiRoutes);

// เชื่อมต่อ DB ก่อนเปิด server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
});
// 👉 บอก Express ว่า:
// ถ้ามี request มา path ขึ้นต้นด้วย "/upload"
// ให้ไปหาไฟล์จากโฟลเดอร์ "upload" ในเครื่อง (backend)

app.use(
  "/upload", // 🔥 URL prefix (route ที่ client เรียก)
  express.static(
    path.join(process.cwd(), "upload"),
    // 🔥 path จริงในเครื่อง เช่น:
    // C:\Users\...\backend\upload
  ),
);
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from Mongoose setup" });
});
