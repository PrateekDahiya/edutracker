import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { Task } from "@/models/Task";
import { addActivity } from "@/services/activityService";

export async function GET(_req: NextRequest, context: unknown) {
  const { params } = context as { params: { id: string } };
  const { id } = params;
  await connectToDatabase();
  const record = await Task.findById(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(req: NextRequest, context: unknown) {
  const { params } = await context;
  await connectToDatabase();
  const data = await req.json();
  const updated = await Task.findByIdAndUpdate(params.id, data, { new: true });
  // If marking as completed, add activity event
  if (data.completed === true) {
    await addActivity({
      user_id: updated.user_id,
      type: "todo",
      label: `Completed task: ${updated.title}`,
      time: new Date(),
      status: "completed",
      related_id: updated._id,
    });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, context: unknown) {
  const { params } = context as { params: { id: string } };
  const { id } = params;
  await connectToDatabase();
  const deleted = await Task.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
} 