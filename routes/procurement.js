// backend/routes/procurement.js
import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const router = express.Router();

// ===============================
// 📌 Fix __dirname
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// 📌 Path เก็บ JSON และ uploads
// ===============================
const dbFile = path.join(__dirname, "../database/mysql/procurement.json");
const uploadDir = path.join(process.cwd(), "uploads", "procurement");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, "[]", "utf8");

// ===============================
// 📌 helper: โหลด/บันทึกข้อมูล
// ===============================
function loadData() {
  try {
    return JSON.parse(fs.readFileSync(dbFile, "utf8") || "[]");
  } catch {
    return [];
  }
}
function saveData(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), "utf8");
}

// ===============================
// 📌 Multer config
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ===============================
// 📌 Routes
// ===============================

// ✅ GET: procurement ทั้งหมด
router.get("/", (req, res) => {
  try {
    res.json(loadData());
  } catch (err) {
    console.error("❌ อ่านไฟล์ไม่สำเร็จ:", err.message);
    res.status(500).json({ error: "อ่านไฟล์ไม่สำเร็จ" });
  }
});

// ✅ POST: เพิ่มประกาศใหม่ (รองรับหลายไฟล์)
router.post("/", upload.array("files"), (req, res) => {
  try {
    const { title, date } = req.body;
    const data = loadData();

    const newItem = {
      id: Date.now().toString(),
      title,
      date: date || new Date().toISOString().split("T")[0],
      files: req.files.map(f => `/uploads/procurement/${f.filename}`)
    };

    data.push(newItem);
    saveData(data);
    res.json({ message: "เพิ่มประกาศจัดซื้อจัดจ้างสำเร็จ", procurement: newItem });
  } catch (err) {
    console.error("❌ เพิ่มไม่สำเร็จ:", err.message);
    res.status(500).json({ error: "บันทึกไม่สำเร็จ" });
  }
});

// ✅ PUT: แก้ไขประกาศ
router.put("/:id", upload.array("files"), (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, removedFiles } = req.body;
    let data = loadData();

    const idx = data.findIndex(item => item.id === id);
    if (idx === -1) return res.status(404).json({ error: "ไม่พบประกาศนี้" });

    // อัปเดตข้อมูล
    data[idx].title = title ?? data[idx].title;
    data[idx].date = date ?? data[idx].date;

    if (!Array.isArray(data[idx].files)) data[idx].files = [];

    // ✅ ลบไฟล์ที่เลือก
    if (removedFiles) {
      const removedArr = JSON.parse(removedFiles);
      removedArr.forEach(f => {
        const filePath = path.resolve(process.cwd(), "." + f);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
      data[idx].files = data[idx].files.filter(f => !removedArr.includes(f));
    }

    // ✅ เพิ่มไฟล์ใหม่
    if (req.files?.length > 0) {
      const newFiles = req.files.map(f => `/uploads/procurement/${f.filename}`);
      data[idx].files = [...data[idx].files, ...newFiles];
    }

    saveData(data);
    res.json({ message: "แก้ไขประกาศเรียบร้อย", procurement: data[idx] });
  } catch (err) {
    console.error("❌ แก้ไขไม่สำเร็จ:", err.message);
    res.status(500).json({ error: "แก้ไขไม่สำเร็จ" });
  }
});

// ✅ DELETE: ลบประกาศ
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    let data = loadData();

    const idx = data.findIndex(item => item.id === id);
    if (idx === -1) return res.status(404).json({ error: "ไม่พบประกาศนี้" });

    // ลบไฟล์จริง
    if (data[idx].files?.length > 0) {
      data[idx].files.forEach(f => {
        const filePath = path.resolve(process.cwd(), "." + f);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    const removed = data.splice(idx, 1);
    saveData(data);

    res.json({ message: "ลบประกาศเรียบร้อย", removed });
  } catch (err) {
    console.error("❌ ลบไม่สำเร็จ:", err.message);
    res.status(500).json({ error: "ลบไม่สำเร็จ" });
  }
});

export { router as procurementRouter };
