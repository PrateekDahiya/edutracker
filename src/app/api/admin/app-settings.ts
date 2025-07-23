import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { AppSettings } from "@/models/AppSettings";
import { AdminAudit } from "@/models/AdminAudit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function GET() {
  await connectToDatabase();
  let settings = await AppSettings.findOne({});
  if (!settings) {
    settings = await AppSettings.create({});
  }
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!(session?.user && (session.user as any).isAdmin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const data = await req.json();
  let settings = await AppSettings.findOneAndUpdate({}, { $set: data, updatedAt: new Date() }, { new: true, upsert: true });
  await AdminAudit.create({
    admin_id: (session.user as any).user_id,
    action: "update_app_settings",
    details: `Updated app settings: ${JSON.stringify(data)}`,
  });
  return NextResponse.json(settings);
} 