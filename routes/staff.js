// backend/routes/staff.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// ===============================
// 📌 Fix __dirname
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// 📌 Path เก็บ DB และไฟล์อัปโหลด
// ===============================
const dbFile = path.join(__dirname, "../database/mysql/staff.json");
const uploadDir = path.join(process.cwd(), "uploads", "staff");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, "[]", "utf8");

// ===============================
// 📌 อ่าน/เขียน DB (JSON)
// ===============================
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(dbFile, "utf8") || "[]");
  } catch {
    return [];
  }
}
function saveDB(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), "utf8");
}

// ===============================
// 📌 Multer config
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ===============================
// 📌 Routes
// ===============================

// ✅ GET: staff ทั้งหมด
router.get("/", (req, res) => {
  res.json(readDB());
});

// ✅ POST: เพิ่ม staff
router.post("/", upload.single("image"), (req, res) => {
  const staff = readDB();
  const newStaff = {
    id: Date.now().toString(),
    name: req.body.name || "ไม่ระบุชื่อ",
    position: req.body.position || "",
    department: req.body.department || "",
    image: req.file ? `/uploads/staff/${req.file.filename}` : ""
  };
  staff.push(newStaff);
  saveDB(staff);
  res.json(newStaff);
});

// ✅ PUT: แก้ไข staff
router.put("/:id", upload.single("image"), (req, res) => {
  let staff = readDB();
  const idx = staff.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "ไม่พบข้อมูล" });

  staff[idx].name = req.body.name ?? staff[idx].name;
  staff[idx].position = req.body.position ?? staff[idx].position;
  staff[idx].department = req.body.department ?? staff[idx].department;

  if (req.file) {
    // ลบไฟล์เก่า (resolve path)
    if (staff[idx].image) {
      const oldPath = path.resolve(process.cwd(), "." + staff[idx].image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    staff[idx].image = `/uploads/staff/${req.file.filename}`;
  }

  saveDB(staff);
  res.json(staff[idx]);
});

// ✅ DELETE: ลบ staff
router.delete("/:id", (req, res) => {
  let staff = readDB();
  const idx = staff.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "ไม่พบข้อมูล" });

  // ลบรูปเก่า (resolve path)
  if (staff[idx].image) {
    const oldPath = path.resolve(process.cwd(), "." + staff[idx].image);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const removed = staff.splice(idx, 1);
  saveDB(staff);

  res.json({ success: true, removed });
});

export default router;
