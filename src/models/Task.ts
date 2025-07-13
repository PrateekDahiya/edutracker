import mongoose, { Schema, model } from "mongoose";

const TaskSchema = new Schema({
  user_id: { type: String, required: true },
  course_id: { type: String, required: true, ref: "Course" },
  course: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ["high", "medium", "low"], required: true },
  due: { type: Date, required: true },
  completed: { type: Boolean, default: false },
});

export const Task = mongoose.models.Task || model("Task", TaskSchema); 