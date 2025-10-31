import mongoose from "mongoose";

const ItaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  pdf: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Ita", ItaSchema);
