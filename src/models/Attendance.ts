import mongoose, { Schema, model } from "mongoose";

const AttendanceSchema = new Schema({
  user_id: { type: String, required: true },
  course_name: { type: String, required: true },
  course_id: { type: String, required: true },
  instructor: { type: String, required: true },
  weekly: { type: Number, required: true },
  type: { type: String, enum: ["lecture", "lab"], required: true },
  required: { type: Number, required: true },
  at_class: { type: Number, required: true },
  t_class: { type: Number, required: true },
  semester_id: { type: String, required: true },
});

export const Attendance = mongoose.models.Attendance || model("Attendance", AttendanceSchema); 