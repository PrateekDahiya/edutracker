import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Check if user already exists
  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  // Hash password
  const hashed = await bcrypt.hash(password, 10);

  // Create user
  const user_id = email.split('@')[0];
  const user = await User.create({ user_id, name, email, password: hashed });

  return NextResponse.json({ success: true, user: { name: user.name, email: user.email } });
} 