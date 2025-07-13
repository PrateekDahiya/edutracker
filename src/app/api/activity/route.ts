import { NextRequest, NextResponse } from "next/server";
import { getActivities, addActivity, ActivityType } from "../../../services/activityService";
import { connectToDatabase } from "../../../models/db";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  const type = searchParams.get("type") as ActivityType | "all" | undefined;
  if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  const activities = await getActivities(user_id, type);
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const data = await req.json();
  if (!data.user_id || !data.type || !data.label || !data.time) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const created = await addActivity(data);
  return NextResponse.json(created);
} 