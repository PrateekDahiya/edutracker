import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { User } from "@/models/User";
import { Task } from "@/models/Task";
import { Attendance } from "@/models/Attendance";
import { Class } from "@/models/Class";
import { AdminAudit } from "@/models/AdminAudit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!(session?.user && (session.user as any).isAdmin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  // User growth (by month)
  const users = await User.find({});
  const userGrowth: Record<string, number> = {};
  users.forEach(u => {
    const month = u.createdAt?.toISOString().slice(0,7) || 'unknown';
    userGrowth[month] = (userGrowth[month] || 0) + 1;
  });
  // Task completion
  const totalTasks = await Task.countDocuments({});
  const completedTasks = await Task.countDocuments({ completed: true });
  // Attendance trends
  const totalAttendance = await Attendance.countDocuments({});
  // Class stats
  const totalClasses = await Class.countDocuments({});
  await AdminAudit.create({
    admin_id: (session.user as any).user_id,
    action: "view_analytics",
    details: `Viewed analytics dashboard`,
  });
  return NextResponse.json({
    userGrowth,
    totalUsers: users.length,
    totalTasks,
    completedTasks,
    totalAttendance,
    totalClasses,
  });
} 