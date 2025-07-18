import { Schema, model } from "mongoose";

const CourseSchema = new Schema({
  course_id: { type: String, required: true, unique: true },
  course_name: { type: String, required: true },
  instructor: { type: String, required: true },
  type: { type: String, enum: ["lecture", "lab"], required: true },
  semester_id: { type: String, required: true },
});

export const Course = model("Course", CourseSchema); 