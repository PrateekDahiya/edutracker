import mongoose, { Schema, model } from "mongoose";

const ClassSchema = new Schema({
  user_id: { type: String, required: true },
  course_id: { type: String, required: true, ref: "Course" },
  courseName: { type: String, required: true },
  day: { type: String, enum: ["monday", "tuesday", "wednesday", "thursday", "friday"], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  type: { type: String, enum: ["lecture", "lab"], required: true },
  instructor: { type: String },
  room: { type: String, required: true },
  color: { type: String },
});

export const Class = mongoose.models.Class || model("Class", ClassSchema); 