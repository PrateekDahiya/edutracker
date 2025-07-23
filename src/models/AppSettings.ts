import mongoose, { Schema, model } from "mongoose";

const AppSettingsSchema = new Schema({
  maintenanceMode: { type: Boolean, default: false },
  featureToggles: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now },
});

export const AppSettings = mongoose.models.AppSettings || model("AppSettings", AppSettingsSchema); 