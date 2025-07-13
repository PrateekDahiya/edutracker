import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { Attendance } from "@/models/Attendance";
import { addActivity } from "@/services/activityService";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  const records = await Attendance.find({ user_id });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const data = await req.json();
  const created = await Attendance.create(data);
  // Add activity event
  await addActivity({
    user_id: data.user_id,
    type: "attendance",
    label: `Attended ${data.course_name}`,
    time: new Date(),
    status: data.status,
    related_id: created._id,
  });
  return NextResponse.json(created, { status: 201 });
} 