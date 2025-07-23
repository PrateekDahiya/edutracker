import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { User } from "@/models/User";
import { Task } from "@/models/Task";
import { Attendance } from "@/models/Attendance";
import { Class } from "@/models/Class";
import { AdminAudit } from "@/models/AdminAudit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

function toCSV(data: any[]): string {
  if (!data.length) return '';
  const keys = Object.keys(data[0]);
  const rows = data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','));
  return [keys.join(','), ...rows].join('\n');
}

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!(session?.user && (session.user as any).isAdmin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  let data = [];
  if (type === "users") data = await User.find({});
  else if (type === "tasks") data = await Task.find({});
  else if (type === "attendance") data = await Attendance.find({});
  else if (type === "classes") data = await Class.find({});
  else return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  await AdminAudit.create({
    admin_id: (session.user as any).user_id,
    action: "export",
    details: `Exported ${type} data`,
  });
  const csv = toCSV(data.map(d => d.toObject ? d.toObject() : d));
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=${type}.csv`,
    },
  });
} 