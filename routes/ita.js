// backend/routes/ita.js
import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import pool from "../config/db.js"   // ✅ ใช้ MySQL pool

const router = express.Router()

// ===============================
// 📂 ตั้งค่า multer
// ===============================
const uploadDir = path.join(process.cwd(), "uploads/ita")
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_")
    cb(null, uniqueName)
  }
})
const upload = multer({ storage })

/* ===========================
   📌 API Routes สำหรับ ITA
   =========================== */

// ✅ GET: ดึง ITA ทั้งหมด
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM ita ORDER BY created_at DESC")
    res.json(rows)
  } catch (err) {
    console.error("❌ โหลด ITA ล้มเหลว:", err.message)
    res.status(500).json({ error: "ไม่สามารถโหลด ITA ได้" })
  }
})

// ✅ POST: เพิ่ม ITA
router.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    const { title, description } = req.body
    const pdf = req.file ? `/uploads/ita/${req.file.filename}` : ""

    const [result] = await pool.query(
      "INSERT INTO ita (title, description, pdf, created_at) VALUES (?, ?, ?, NOW())",
      [title, description, pdf]
    )

    res.json({
      message: "เพิ่ม ITA สำเร็จ",
      ita: { id: result.insertId, title, description, pdf }
    })
  } catch (err) {
    console.error("❌ เพิ่ม ITA ไม่สำเร็จ:", err.message)
    res.status(500).json({ error: "เพิ่ม ITA ไม่สำเร็จ" })
  }
})

// ✅ PUT: อัปเดต ITA
router.put("/:id", upload.single("pdf"), async (req, res) => {
  try {
    const { title, description } = req.body
    const id = req.params.id

    const [rows] = await pool.query("SELECT * FROM ita WHERE id = ?", [id])
    if (rows.length === 0) return res.status(404).json({ error: "ไม่พบ ITA" })

    let pdf = rows[0].pdf
    if (req.file) {
      // ลบไฟล์เก่าออกถ้ามี
      if (pdf) {
        const oldPath = path.join(process.cwd(), pdf.replace("/uploads", "uploads"))
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }
      pdf = `/uploads/ita/${req.file.filename}`
    }

    await pool.query(
      "UPDATE ita SET title = ?, description = ?, pdf = ? WHERE id = ?",
      [title, description, pdf, id]
    )

    res.json({
      message: "อัปเดต ITA สำเร็จ",
      ita: { id, title, description, pdf }
    })
  } catch (err) {
    console.error("❌ อัปเดต ITA ไม่สำเร็จ:", err.message)
    res.status(500).json({ error: "อัปเดต ITA ไม่สำเร็จ" })
  }
})

// ✅ DELETE: ลบ ITA
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id

    const [rows] = await pool.query("SELECT * FROM ita WHERE id = ?", [id])
    if (rows.length === 0) return res.status(404).json({ error: "ไม่พบ ITA" })

    const pdf = rows[0].pdf
    if (pdf) {
      const filePath = path.join(process.cwd(), pdf.replace("/uploads", "uploads"))
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    await pool.query("DELETE FROM ita WHERE id = ?", [id])
    res.json({ message: "ลบ ITA เรียบร้อย" })
  } catch (err) {
    console.error("❌ ลบ ITA ไม่สำเร็จ:", err.message)
    res.status(500).json({ error: "ลบ ITA ไม่สำเร็จ" })
  }
})

export { router as itaRouter }
