// backend/routes/upload.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();

// ===============================
// 📌 Fix __dirname
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// 📌 Allowed upload types
// ===============================
const allowedTypes = ["news", "activities", "staff", "downloads", "procurement", "jobs"];

// ===============================
// 📌 Multer config
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = (req.query.type || "news").toLowerCase();

    // ป้องกันโฟลเดอร์แปลก ๆ
    if (!allowedTypes.includes(type)) {
      return cb(new Error("โฟลเดอร์ไม่ถูกต้อง"));
    }

    const dir = path.join(process.cwd(), "uploads", type);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  }
});

const upload = multer({ storage });

// ===============================
// 📌 API Upload (image/file)
// ===============================
router.post("/image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "ไม่พบไฟล์" });

    const type = (req.query.type || "news").toLowerCase();
    res.json({
      message: "อัปโหลดสำเร็จ",
      fileUrl: `/uploads/${type}/${req.file.filename}`
    });
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ error: "อัปโหลดไม่สำเร็จ" });
  }
});

export { router as uploadRouter };

