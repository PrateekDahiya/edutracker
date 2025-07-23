import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { User } from "@/models/User";
import { AdminAudit } from "@/models/AdminAudit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!(session?.user && (session.user as any).isAdmin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  const user = await User.findOne({ user_id });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  // Log impersonation
  await AdminAudit.create({
    admin_id: (session.user as any).user_id,
    action: "impersonate",
    target_user_id: user_id,
    details: `Impersonated user ${user_id}`,
  });
  // For demo, just return user data. In production, issue a JWT or session token.
  return NextResponse.json({ success: true, user });
} 