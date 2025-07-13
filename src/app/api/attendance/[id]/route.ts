import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { Attendance } from "@/models/Attendance";

export async function GET(_req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  await connectToDatabase();
  const record = await Attendance.findById(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  await connectToDatabase();
  const data = await req.json();
  const updated = await Attendance.findByIdAndUpdate(id, data, { new: true });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  await connectToDatabase();
  const deleted = await Attendance.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
} 