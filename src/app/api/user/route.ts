import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { getUserByEmail, updateUserProfile, getUserCounter, updateUserCounter } from "@/services/userService";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const counter = searchParams.get("counter");
  if (counter !== null) {
    // GET /api/user/counter?email=...
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
    const data = await getUserCounter(email);
    return NextResponse.json(data);
  }
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  const user = await getUserByEmail(email);
  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const data = await req.json();
  if (data.counter !== undefined) {
    // POST /api/user/counter { email, counter, counterStartDate }
    if (!data.email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
    const updated = await updateUserCounter(data.email, data.counter, data.counterStartDate);
    return NextResponse.json(updated);
  }
  if (!data.email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  const updated = await updateUserProfile(data.email, data);
  return NextResponse.json(updated);
} 