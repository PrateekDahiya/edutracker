import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema({
  user_id: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  college: { type: String },
  password: { type: String }, // For credentials auth
  counter: { type: Number, default: 0 },
  counterStartDate: { type: Date },
});

export const User = models.User || mongoose.model("User", UserSchema); 