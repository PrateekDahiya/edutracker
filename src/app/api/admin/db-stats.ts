import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import mongoose from "mongoose";
import { AdminAudit } from "@/models/AdminAudit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!(session?.user && (session.user as any).isAdmin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const db = mongoose.connection.db;
  if (!db) {
    return NextResponse.json({ error: "Database not connected" }, { status: 500 });
  }
  const collections = await db.listCollections().toArray();
  const stats = await db.stats();
  await AdminAudit.create({
    admin_id: (session.user as any).user_id,
    action: "view_db_stats",
    details: `Viewed DB stats`,
  });
  return NextResponse.json({
    collections: collections.map(c => c.name),
    stats,
  });
} 