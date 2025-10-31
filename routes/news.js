import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import pool from "../config/db.js";  // ✅ ใช้ MySQL Connection

const router = express.Router();

// ===============================
// 📌 ตั้งค่า multer (สำหรับอัปโหลดรูปและ PDF)
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads/news");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});
const upload = multer({ storage });

// ===============================
// 📌 GET: ดึงข่าวทั้งหมด
// ===============================
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM news ORDER BY created_at DESC");
    // ✅ parse images JSON ให้อ่านง่าย
    const news = rows.map(n => ({
      ...n,
      images: n.images ? JSON.parse(n.images) : []
    }));
    res.json(news);
  } catch (err) {
    console.error("❌ ดึงข่าวไม่สำเร็จ:", err.message);
    res.status(500).json({ error: "ไม่สามารถดึงข่าวได้" });
  }
});

// ===============================
// 📌 POST: เพิ่มข่าว (รองรับหลายรูป, URL, PDF)
// ===============================
router.post(
  "/upload",
  upload.fields([{ name: "images", maxCount: 10 }, { name: "pdf", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { title, description, imageUrl } = req.body;
      let images = [];

      // ✅ อัปโหลดไฟล์รูป
      if (req.files?.images) {
        images = req.files.images.map(f => `/uploads/news/${f.filename}`);
      }

      // ✅ รองรับ URL
      if (imageUrl) {
        const arr = Array.isArray(imageUrl) ? imageUrl : imageUrl.split(",");
        images.push(...arr.map(u => u.trim()).filter(Boolean));
      }

      // ✅ PDF
      const pdf = req.files?.pdf
        ? `/uploads/news/${req.files.pdf[0].filename}`
        : "";

      // ✅ บันทึกลง MySQL
      const [result] = await pool.query(
        "INSERT INTO news (title, description, images, pdf, created_at) VALUES (?, ?, ?, ?, NOW())",
        [title, description, JSON.stringify(images), pdf]
      );

      res.json({
        message: "เพิ่มข่าวสำเร็จ",
        news: { id: result.insertId, title, description, images, pdf },
      });
    } catch (err) {
      console.error("❌ บันทึกข่าวไม่สำเร็จ:", err.message);
      res.status(500).json({ error: "บันทึกข่าวไม่สำเร็จ" });
    }
  }
);

// ===============================
// 📌 PUT: แก้ไขข่าว
// ===============================
router.put(
  "/:id",
  upload.fields([{ name: "images", maxCount: 10 }, { name: "pdf", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { title, description, imageUrl } = req.body;
      const [rows] = await pool.query("SELECT * FROM news WHERE id = ?", [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: "ไม่พบข่าว" });

      let news = rows[0];
      let images = news.images ? JSON.parse(news.images) : [];

      // ✅ ถ้ามีไฟล์รูปใหม่
      if (req.files?.images) {
        images = req.files.images.map(f => `/uploads/news/${f.filename}`);
      }

      // ✅ ถ้ามี URL เพิ่ม
      if (imageUrl) {
        const arr = Array.isArray(imageUrl) ? imageUrl : imageUrl.split(",");
        images.push(...arr.map(u => u.trim()).filter(Boolean));
      }

      // ✅ ถ้ามี PDF ใหม่
      const pdf = req.files?.pdf
        ? `/uploads/news/${req.files.pdf[0].filename}`
        : news.pdf;

      await pool.query(
        "UPDATE news SET title = ?, description = ?, images = ?, pdf = ? WHERE id = ?",
        [title, description, JSON.stringify(images), pdf, req.params.id]
      );

      res.json({
        message: "อัปเดตข่าวสำเร็จ",
        news: { id: req.params.id, title, description, images, pdf },
      });
    } catch (err) {
      console.error("❌ อัปเดตข่าวไม่สำเร็จ:", err.message);
      res.status(500).json({ error: "อัปเดตข่าวไม่สำเร็จ" });
    }
  }
);

// ===============================
// 📌 DELETE: ลบข่าว
// ===============================
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM news WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "ไม่พบข่าว" });

    res.json({ message: "ลบข่าวเรียบร้อย" });
  } catch (err) {
    console.error("❌ ลบข่าวไม่สำเร็จ:", err.message);
    res.status(500).json({ error: "ลบข่าวไม่สำเร็จ" });
  }
});

// ✅ export แบบใหม่
export { router as newsRouter };

