import express from "express"
import fs from "fs"
import path from "path"
import multer from "multer"
import jwt from "jsonwebtoken"

const router = express.Router()

// 📂 path เก็บ activities.json (ใช้ absolute path ป้องกัน error)
const activitiesFile = path.join(process.cwd(), "database", "mysql", "activities.json")

// === Helper functions ===
function readActivities() {
  try {
    return JSON.parse(fs.readFileSync(activitiesFile, "utf-8") || "[]")
  } catch {
    return []
  }
}

function writeActivities(data) {
  fs.writeFileSync(activitiesFile, JSON.stringify(data, null, 2), "utf-8")
}

function unlinkIfUpload(filePathLike) {
  try {
    if (filePathLike?.startsWith("/uploads/activities")) {
      const abs = path.join(process.cwd(), filePathLike.replace("/uploads", "uploads"))
      if (fs.existsSync(abs)) fs.unlinkSync(abs)
    }
  } catch {}
}

// ✅ Middleware ตรวจสอบ Admin
function isAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ message: "Unauthorized" })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret")
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden: Admin only" })
    }
    next()
  } catch {
    return res.status(401).json({ message: "Invalid token" })
  }
}

// ✨ เปิด/ปิดการตรวจสิทธิ์ผ่าน ENV
const ACTIVITIES_AUTH = (process.env.ACTIVITIES_AUTH || "off").toLowerCase()
const adminGuard = (req, res, next) =>
  ACTIVITIES_AUTH === "on" ? isAdmin(req, res, next) : next()

// 📂 ตั้งค่า multer สำหรับ uploads -> แยกโฟลเดอร์ activities
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "activities")
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_")
    cb(null, uniqueName)
  }
})

const upload = multer({ storage })

// ✅ GET: ดึงกิจกรรมทั้งหมด (public)
router.get("/", (req, res) => {
  res.json(readActivities())
})

// ✅ GET: ดึงกิจกรรมเดี่ยว (public)
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id)
  const item = readActivities().find(a => a.id === id)
  if (!item) return res.status(404).json({ message: "ไม่พบกิจกรรมนี้" })
  res.json(item)
})

// ✅ POST: เพิ่มกิจกรรมใหม่
router.post("/", adminGuard, upload.fields([{ name: "image" }, { name: "pdf" }]), (req, res) => {
  const activities = readActivities()

  let imagePath = "/images/default.png"
  if (req.files?.image) {
    imagePath = `/uploads/activities/${req.files.image[0].filename}`
  } else if (req.body.imageUrl) {
    imagePath = req.body.imageUrl
  }

  let pdfPath = ""
  if (req.files?.pdf) {
    pdfPath = `/uploads/activities/${req.files.pdf[0].filename}`
  } else if (req.body.pdfUrl) {
    pdfPath = req.body.pdfUrl
  }

  const newActivity = {
    id: Date.now(),
    title: req.body.title,
    description: req.body.description,
    image: imagePath,
    pdf: pdfPath
  }

  activities.push(newActivity)
  writeActivities(activities)

  res.json({ message: "เพิ่มกิจกรรมสำเร็จ", activity: newActivity })
})

// ✅ PUT: อัปเดตกิจกรรม
router.put("/:id", adminGuard, upload.fields([{ name: "image" }, { name: "pdf" }]), (req, res) => {
  const id = parseInt(req.params.id)
  const activities = readActivities()
  const idx = activities.findIndex(a => a.id === id)
  if (idx === -1) return res.status(404).json({ message: "ไม่พบกิจกรรมนี้" })

  const old = activities[idx]

  const title = req.body.title ?? old.title
  const description = req.body.description ?? old.description

  let image = old.image
  if (typeof req.body.imageUrl !== "undefined") {
    if (req.body.imageUrl !== old.image) unlinkIfUpload(old.image)
    image = req.body.imageUrl || ""
  } else if (req.files?.image) {
    unlinkIfUpload(old.image)
    image = `/uploads/activities/${req.files.image[0].filename}`
  }

  let pdf = old.pdf
  if (typeof req.body.pdfUrl !== "undefined") {
    if (req.body.pdfUrl !== old.pdf) unlinkIfUpload(old.pdf)
    pdf = req.body.pdfUrl || ""
  } else if (req.files?.pdf) {
    unlinkIfUpload(old.pdf)
    pdf = `/uploads/activities/${req.files.pdf[0].filename}`
  }

  const updated = { ...old, title, description, image, pdf }
  activities[idx] = updated
  writeActivities(activities)

  res.json({ message: "อัปเดตกิจกรรมสำเร็จ", activity: updated })
})

// ✅ DELETE: ลบกิจกรรม
router.delete("/:id", adminGuard, (req, res) => {
  let activities = readActivities()
  const id = parseInt(req.params.id)

  const activity = activities.find(a => a.id === id)
  if (activity) {
    unlinkIfUpload(activity.image)
    unlinkIfUpload(activity.pdf)
  }

  activities = activities.filter(a => a.id !== id)
  writeActivities(activities)

  res.json({ message: "ลบกิจกรรมสำเร็จ", success: true })
})

export { router as activitiesRouter };
