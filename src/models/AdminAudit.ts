import mongoose, { Schema, model } from "mongoose";

const AdminAuditSchema = new Schema({
  admin_id: { type: String, required: true },
  action: { type: String, required: true }, // e.g. 'edit_user', 'delete_user', 'impersonate', etc
  target_user_id: { type: String },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const AdminAudit = mongoose.models.AdminAudit || model("AdminAudit", AdminAuditSchema); 