import mongoose, { Schema, models } from "mongoose";

const SettingSchema = new Schema({
  user_id: { type: String, required: true, unique: true },
  lectureDuration: { type: Number, required: true },
  labDuration: { type: Number, required: true },
  semesterStart: { type: String },
  semesterEnd: { type: String },
  notifSound: { type: Boolean, required: true },
  timeFormat: { type: String, enum: ["12h", "24h"], required: true },
  theme: { type: String, enum: ["light", "dark", "system"], required: true },
});

export default models.Setting || mongoose.model("Setting", SettingSchema); 