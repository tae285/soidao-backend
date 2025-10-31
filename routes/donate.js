// backend/routes/donate.js
import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const router = express.Router()

// ===============================
// 📌 Fix __dirname
// ===============================
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ===============================
// 📌 Path JSON (ใช้แทน DB เบื้องต้น)
// ===============================
const dbFile = path.join(__dirname, "../database/mysql/donate.json")
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, "[]", "utf8")

function readDonors() {
  try {
    return JSON.parse(fs.readFileSync(dbFile, "utf8"))
  } catch {
    return []
  }
}
function saveDonors(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), "utf8")
}

// ===============================
// 📌 Multer Config (เก็บที่ uploads/donate)
// ===============================
const uploadDir = path.join(process.cwd(), "uploads/donate")
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_")
    cb(null, uniqueName)
  }
})
const upload = multer({ storage })

// ===============================
// ✅ GET: ดึงผู้บริจาคทั้งหมด
// ===============================
router.get("/", (req, res) => {
  res.json(readDonors())
})

// ===============================
// ✅ POST: เพิ่มผู้บริจาคใหม่ (รองรับไฟล์รูป)
// ===============================
router.post("/", upload.single("image"), (req, res) => {
  const donors = readDonors()
  const { name, amount, item, date } = req.body

  const newDonor = {
    id: Date.now().toString(),
    name,
    amount: Number(amount) || 0,
    item,
    date: date || new Date().toISOString().split("T")[0],
    image: req.file ? `/uploads/donate/${req.file.filename}` : null
  }

  donors.push(newDonor)
  saveDonors(donors)

  res.json({ message: "เพิ่มผู้บริจาคสำเร็จ", donor: newDonor })
})

// ===============================
// ✅ DELETE: ลบผู้บริจาค
// ===============================
router.delete("/:id", (req, res) => {
  let donors = readDonors()
  const { id } = req.params

  const target = donors.find(d => d.id === id)
  if (!target) return res.status(404).json({ error: "ไม่พบผู้บริจาค" })

  // ลบไฟล์รูปออกด้วย
  if (target.image) {
    const filePath = path.join(process.cwd(), target.image.replace("/uploads", "uploads"))
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  donors = donors.filter(d => d.id !== id)
  saveDonors(donors)

  res.json({ message: "ลบผู้บริจาคสำเร็จ", success: true })
})

export default router
