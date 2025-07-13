import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  college: { type: String },
  password: { type: String }, // For credentials auth
});

export const User = models.User || mongoose.model("User", UserSchema); 