import mongoose, { Schema, model } from "mongoose";

const UserActivitySchema = new Schema({
  user_id: { type: String, required: true },
  action: { type: String, required: true }, // e.g. 'login', 'edit', 'delete', etc
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const UserActivity = mongoose.models.UserActivity || model("UserActivity", UserActivitySchema); 