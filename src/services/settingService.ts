import Setting from "../models/Setting";

export type SettingType = {
  user_id: string;
  lectureDuration: number;
  labDuration: number;
  semesterStart?: string;
  semesterEnd?: string;
  notifSound: boolean;
  timeFormat: "12h" | "24h";
  theme: "light" | "dark" | "system";
};

export async function getSetting(user_id: string) {
  return await Setting.findOne({ user_id });
}

export async function saveSetting(setting: SettingType) {
  return await Setting.findOneAndUpdate(
    { user_id: setting.user_id },
    { $set: setting },
    { upsert: true, new: true }
  );
} 