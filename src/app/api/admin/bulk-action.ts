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
  const { action, user_ids } = await req.json();
  if (!action || !Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ error: "Missing action or user_ids" }, { status: 400 });
  }
  let result = [];
  for (const user_id of user_ids) {
    let res;
    if (action === "delete") {
      res = await User.findOneAndDelete({ user_id });
    } else if (action === "activate") {
      res = await User.findOneAndUpdate({ user_id }, { isActive: true }, { new: true });
    } else if (action === "deactivate") {
      res = await User.findOneAndUpdate({ user_id }, { isActive: false }, { new: true });
    } else if (action === "setAdmin") {
      res = await User.findOneAndUpdate({ user_id }, { isAdmin: true }, { new: true });
    } else if (action === "unsetAdmin") {
      res = await User.findOneAndUpdate({ user_id }, { isAdmin: false }, { new: true });
    }
    if (res) {
      await AdminAudit.create({
        admin_id: (session.user as any).user_id,
        action: `bulk_${action}`,
        target_user_id: user_id,
        details: `Bulk ${action} on user ${user_id}`,
      });
      result.push(res);
    }
  }
  return NextResponse.json({ success: true, result });
} 