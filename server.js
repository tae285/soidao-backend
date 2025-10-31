import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import pool from "./config/db.js";

// โหลดค่า .env
dotenv.config();

// 📌 import routes (統一ให้ใช้ named export)
import { authRouter } from "./routes/auth.js";
import { jobsRouter } from "./routes/jobs.js";
import { newsRouter } from "./routes/news.js";
import { activitiesRouter } from "./routes/activities.js";
import { staffRouter } from "./routes/staff.js";
import { downloadsRouter } from "./routes/downloads.js";
import { procurementRouter } from "./routes/procurement.js";
import { uploadRouter } from "./routes/upload.js";
import { donateRouter } from "./routes/donate.js";
import { itaRouter } from "./routes/ita.js";

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",       // ✅ frontend dev
    "https://*.trycloudflare.com", // ✅ ถ้าคุณใช้ Cloudflare tunnel
    "https://www.soidao.go.th"     // ✅ ถ้าในอนาคตเชื่อมกับเว็บจริง
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// ✅ ทดสอบเชื่อมต่อ MySQL
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL error:", err.message);
  }
})();

// 📂 สร้างโฟลเดอร์ uploads + subfolders
const uploadDir = path.join(process.cwd(), "uploads");
const subDirs = ["activities", "downloads", "staff", "news", "procurement", "jobs"];
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
subDirs.forEach((dir) => {
  const fullPath = path.join(uploadDir, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// ✅ เสิร์ฟไฟล์อัปโหลด
subDirs.forEach((dir) => {
  app.use(`/uploads/${dir}`, express.static(path.join(uploadDir, dir)));
});
// fallback เผื่อ path ไม่ตรง
app.use("/uploads", express.static(uploadDir));

// ✅ API Routes
app.use("/api/upload", uploadRouter);
app.use("/api/auth", authRouter);
app.use("/api/news", newsRouter);
app.use("/api/procurement", procurementRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/staff", staffRouter);
app.use("/api/downloads", downloadsRouter);
app.use("/api/donate", donateRouter);
app.use("/api/ita", itaRouter);
app.use("/api/activities", activitiesRouter);

// ✅ FRONTEND (dist)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend-app/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend-app/dist/index.html"));
});

// ✅ Server Start
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://${HOST}:${PORT}`);
});
