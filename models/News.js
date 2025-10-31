import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },          // หัวข้อข่าว
  description: { type: String },                    // รายละเอียด (optional)
  images: { type: [String], default: [] },          // เก็บ URL หรือ path ของหลายรูป
  pdf: { type: String, default: "" },               // ไฟล์ PDF (ถ้ามี)
  createdAt: { type: Date, default: Date.now }      // วันที่สร้าง
});

export default mongoose.model("News", newsSchema);
