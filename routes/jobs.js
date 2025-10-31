import express from "express"
import fs from "fs"
import path from "path"
import multer from "multer"

const router = express.Router()
const jobsFile = path.join(process.cwd(), "database", "mysql", "jobs.json") // ✅ ไม่ต้องถอยออกไป ..

// 📂 ที่เก็บไฟล์อัปโหลด (uploads/jobs)
const uploadDir = path.join(process.cwd(), "uploads", "jobs")
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

// 📌 config multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_")
    cb(null, uniqueName)
  }
})
const upload = multer({ storage })

// 📌 อ่าน jobs.json
function readJobs() {
  try {
    return JSON.parse(fs.readFileSync(jobsFile, "utf-8") || "[]")
  } catch {
    return []
  }
}

// 📌 เขียน jobs.json
function writeJobs(data) {
  fs.writeFileSync(jobsFile, JSON.stringify(data, null, 2), "utf-8")
}

// ✅ อ่านงานทั้งหมด
router.get("/", (req, res) => {
  res.json(readJobs())
})

// ✅ เพิ่มงานใหม่ (รองรับไฟล์)
router.post("/", upload.single("file"), (req, res) => {
  const jobs = readJobs()
  const newJob = {
    id: Date.now(),   // 👈 เก็บเป็น number
    title: req.body.title,
    description: req.body.description,
    deadline: req.body.deadline,
    file: req.file ? `/uploads/jobs/${req.file.filename}` : null
  }
  jobs.push(newJob)
  writeJobs(jobs)
  res.json(newJob)
})

// ✅ แก้ไขงาน
router.put("/:id", upload.single("file"), (req, res) => {
  const jobs = readJobs()
  const id = Number(req.params.id)
  const idx = jobs.findIndex(j => j.id === id)
  if (idx === -1) return res.status(404).json({ error: "ไม่พบงาน" })

  // ถ้ามีไฟล์ใหม่ ลบไฟล์เก่า
  if (req.file) {
    if (jobs[idx].file) {
      const oldPath = path.join(process.cwd(), jobs[idx].file.replace("/uploads", "uploads"))
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
    }
    jobs[idx].file = `/uploads/jobs/${req.file.filename}`
  }

  jobs[idx] = { ...jobs[idx], ...req.body, id }
  writeJobs(jobs)
  res.json(jobs[idx])
})

// ✅ ลบงาน
router.delete("/:id", (req, res) => {
  const jobs = readJobs()
  const id = Number(req.params.id)
  const job = jobs.find(j => j.id === id)

  if (!job) return res.status(404).json({ error: "ไม่พบงาน" })

  if (job.file) {
    const filePath = path.join(process.cwd(), job.file.replace("/uploads", "uploads"))
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  const filtered = jobs.filter(j => j.id !== id)
  writeJobs(filtered)
  res.json({ success: true })
})

// ✅ export แบบใหม่
export default router
