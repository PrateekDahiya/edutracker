import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { getUserByEmail, updateUserProfile } from "@/services/userService";
import { Task } from "@/models/Task";
import { Attendance } from "@/models/Attendance";
import { Class } from "@/models/Class";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all");
  if (all) {
    // Admin analytics endpoint
    const session = await getServerSession(authOptions);
    if (!(session?.user && (session.user as any).isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const users = await User.find({});
    const userStats = await Promise.all(users.map(async (user: any) => {
      const taskCount = await Task.countDocuments({ user_id: user.user_id });
      const attendanceCount = await Attendance.countDocuments({ user_id: user.user_id });
      const classCount = await Class.countDocuments({ user_id: user.user_id });
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        user_id: user.user_id,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin,
        taskCount,
        attendanceCount,
        classCount,
      };
    }));
    const totalUsers = users.length;
    const totalTasks = await Task.countDocuments({});
    const totalAttendance = await Attendance.countDocuments({});
    const totalClasses = await Class.countDocuments({});
    return NextResponse.json({
      users: userStats,
      totalUsers,
      totalTasks,
      totalAttendance,
      totalClasses,
    });
  }
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

export async function PUT(req: NextRequest) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!(session?.user && (session.user as any).isAdmin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const data = await req.json();
  if (!data.user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  const updateFields = { ...data };
  delete updateFields.user_id;
  const updated = await User.findOneAndUpdate({ user_id: data.user_id }, updateFields, { new: true });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!(session?.user && (session.user as any).isAdmin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const data = await req.json();
  if (!data.user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  const deleted = await User.findOneAndDelete({ user_id: data.user_id });
  return NextResponse.json({ success: !!deleted });
} 