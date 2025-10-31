import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const router = express.Router();

// ===============================
// 📌 Fix __dirname
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// 📌 Path เก็บ JSON และไฟล์อัปโหลด
// ===============================
const downloadsFile = path.join(__dirname, "../database/mysql/downloads.json");
const uploadDir = path.join(process.cwd(), "uploads", "downloads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ===============================
// 📌 ตั้งค่า multer (บังคับชื่อไฟล์ unique + นามสกุลเดิม)
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, `${Date.now()}${ext}`); // เช่น 17301752398.pdf
  }
});
const upload = multer({ storage });

// ===============================
// 📌 GET: โหลดรายการทั้งหมด
// ===============================
router.get("/", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(downloadsFile, "utf8") || "[]");
    res.json(data);
  } catch (err) {
    console.error("❌ โหลดไฟล์ไม่สำเร็จ:", err.message);
    res.status(500).json({ error: "โหลดไฟล์ไม่สำเร็จ" });
  }
});

// ===============================
// 📌 POST: เพิ่มไฟล์ใหม่
// ===============================
router.post("/", upload.single("file"), (req, res) => {
  try {
    const { name, category } = req.body;
    const data = JSON.parse(fs.readFileSync(downloadsFile, "utf8") || "[]");

    const newItem = {
      id: Date.now().toString(),
      name: name || "ไม่ระบุชื่อ",
      category: category || "ทั่วไป",
      url: req.file ? `/uploads/downloads/${req.file.filename}` : ""
    };

    data.push(newItem);
    fs.writeFileSync(downloadsFile, JSON.stringify(data, null, 2), "utf8");

    res.json({ message: "เพิ่มไฟล์สำเร็จ", file: newItem });
  } catch (err) {
    console.error("❌ เพิ่มไฟล์ไม่สำเร็จ:", err.message);
    res.status(500).json({ error: "เพิ่มไฟล์ไม่สำเร็จ" });
  }
});

// ===============================
// 📌 PUT: แก้ไขไฟล์
// ===============================
router.put("/:id", upload.single("file"), (req, res) => {
  try {
    const { id } = req.params;
    const { name, category } = req.body;
    let data = JSON.parse(fs.readFileSync(downloadsFile, "utf8") || "[]");

    const idx = data.findIndex(item => item.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "ไม่พบไฟล์ในฐานข้อมูล" });
    }

    // ✅ ถ้ามีไฟล์ใหม่ → ลบไฟล์เก่า
    if (req.file) {
      if (data[idx].url) {
        const oldPath = path.resolve(process.cwd(), "." + data[idx].url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log("🗑️ ลบไฟล์เก่า:", oldPath);
        }
      }
      data[idx].url = `/uploads/downloads/${req.file.filename}`;
    }

    // ✅ อัปเดตข้อมูล
    data[idx].name = name || data[idx].name;
    data[idx].category = category || data[idx].category;

    fs.writeFileSync(downloadsFile, JSON.stringify(data, null, 2), "utf8");
    res.json({ message: "อัปเดตไฟล์สำเร็จ", file: data[idx] });
  } catch (err) {
    console.error("❌ อัปเดตไฟล์ไม่สำเร็จ:", err.message);
    res.status(500).json({ error: "อัปเดตไฟล์ไม่สำเร็จ" });
  }
});

// ===============================
// 📌 DELETE: ลบไฟล์
// ===============================
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    let data = JSON.parse(fs.readFileSync(downloadsFile, "utf8") || "[]");
    const file = data.find(item => item.id === id);

    if (!file) {
      return res.status(404).json({ error: "ไม่พบไฟล์ในฐานข้อมูล" });
    }

    const filePath = path.resolve(process.cwd(), "." + file.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ ลบไฟล์จริง:", filePath);
    }

    data = data.filter(item => item.id !== id);
    fs.writeFileSync(downloadsFile, JSON.stringify(data, null, 2), "utf8");

    res.json({ message: "ลบไฟล์สำเร็จ", success: true });
  } catch (err) {
    console.error("❌ ลบไฟล์ไม่สำเร็จ:", err.message);
    res.status(500).json({ error: "ลบไฟล์ไม่สำเร็จ", details: err.message });
  }
});

export default router;
