import Activity from "../models/Activity";

export type ActivityType = "attendance" | "task";
export interface ActivityInput {
  user_id: string;
  type: ActivityType;
  label: string;
  time: Date;
  status?: string;
  related_id?: string;
}

export async function addActivity(activity: ActivityInput) {
  return await Activity.create(activity);
}

export async function getActivities(user_id: string, type?: ActivityType | "all") {
  const query: any = { user_id };
  if (type && type !== "all") query.type = type;
  return await Activity.find(query).sort({ time: -1 });
} 