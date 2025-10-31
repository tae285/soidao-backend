import express from "express"
const router = express.Router()

// ✅ ล็อคอิน
router.post("/login", (req, res) => {
  const { username, password } = req.body
  if (username === "admin.sdh" && password === "@@242519") {
    return res.json({ success: true, role: "ADMIN", username })
  }
  res.status(401).json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" })
})

export { router as authRouter }
