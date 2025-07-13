import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { getUserByEmail, updateUserProfile } from "@/services/userService";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  const user = await getUserByEmail(email);
  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const data = await req.json();
  if (!data.email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  const updated = await updateUserProfile(data.email, data);
  return NextResponse.json(updated);
} 