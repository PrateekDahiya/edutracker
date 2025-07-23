import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { AdminAudit } from "@/models/AdminAudit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!(session?.user && (session.user as any).isAdmin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const admin_id = searchParams.get("admin_id");
  const action = searchParams.get("action");
  const query: any = {};
  if (admin_id) query.admin_id = admin_id;
  if (action) query.action = action;
  const logs = await AdminAudit.find(query).sort({ timestamp: -1 }).limit(100);
  await AdminAudit.create({
    admin_id: (session.user as any).user_id,
    action: "view_audit_logs",
    details: `Viewed audit logs`,
  });
  return NextResponse.json(logs);
} 