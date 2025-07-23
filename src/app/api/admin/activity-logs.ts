import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import Activity from "@/models/Activity";
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
  const user_id = searchParams.get("user_id");
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const query: any = {};
  if (user_id) query.user_id = user_id;
  if (type) query.type = type;
  if (from || to) {
    query.time = {};
    if (from) query.time.$gte = new Date(from);
    if (to) query.time.$lte = new Date(to);
  }
  const logs = await Activity.find(query).sort({ time: -1 }).limit(200);
  await AdminAudit.create({
    admin_id: (session.user as any).user_id,
    action: "view_activity_logs",
    details: `Viewed activity logs`,
  });
  return NextResponse.json(logs);
} 