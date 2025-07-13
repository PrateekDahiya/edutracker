import mongoose, { Schema, models } from "mongoose";

const ActivitySchema = new Schema({
  user_id: { type: String, required: true },
  type: { type: String, enum: ["attendance", "task"], required: true },
  label: { type: String, required: true },
  time: { type: Date, required: true },
  status: { type: String },
  related_id: { type: String },
});

export default models.Activity || mongoose.model("Activity", ActivitySchema); 