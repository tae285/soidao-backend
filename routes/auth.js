import express from "express";
const authRouter = express.Router();

// ตัวอย่าง API
authRouter.post("/login", (req, res) => {
  res.json({ message: "Login success" });
});

export { authRouter };
