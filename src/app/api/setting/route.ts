import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { saveSetting, SettingType } from "@/services/settingService";
import Setting from "@/models/Setting";

// Validation function for settings
function validateSettings(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object' || !('user_id' in data)) {
    errors.push('user_id is required and must be a string');
  } else {
    const user_id = (data as { user_id: string }).user_id;
    if (!user_id || typeof user_id !== 'string') {
      errors.push('user_id is required and must be a string');
    }
  }
  
  if (!data || typeof data !== 'object' || !('lectureDuration' in data)) {
    errors.push('lectureDuration must be a number between 30 and 180');
  } else {
    const lectureDuration = (data as { lectureDuration: number }).lectureDuration;
    if (typeof lectureDuration !== 'number' || lectureDuration < 30 || lectureDuration > 180) {
      errors.push('lectureDuration must be a number between 30 and 180');
    }
  }
  
  if (!data || typeof data !== 'object' || !('labDuration' in data)) {
    errors.push('labDuration must be a number between 30 and 240');
  } else {
    const labDuration = (data as { labDuration: number }).labDuration;
    if (typeof labDuration !== 'number' || labDuration < 30 || labDuration > 240) {
      errors.push('labDuration must be a number between 30 and 240');
    }
  }
  
  if (!data || typeof data !== 'object' || !('notifSound' in data)) {
    errors.push('notifSound must be a boolean');
  } else {
    const notifSound = (data as { notifSound: boolean }).notifSound;
    if (typeof notifSound !== 'boolean') {
      errors.push('notifSound must be a boolean');
    }
  }
  
  if (!data || typeof data !== 'object' || !('timeFormat' in data)) {
    errors.push('timeFormat must be either "12h" or "24h"');
  } else {
    const timeFormat = (data as { timeFormat: string }).timeFormat;
    if (!['12h', '24h'].includes(timeFormat)) {
      errors.push('timeFormat must be either "12h" or "24h"');
    }
  }
  
  if (!data || typeof data !== 'object' || !('theme' in data)) {
    errors.push('theme must be either "light", "dark", or "system"');
  } else {
    const theme = (data as { theme: string }).theme;
    if (!['light', 'dark', 'system'].includes(theme)) {
      errors.push('theme must be either "light", "dark", or "system"');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  let user_id = searchParams.get("user_id");
  if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  user_id = user_id.split('@')[0];
  const setting = await Setting.findOne({ user_id }) as unknown;
  return NextResponse.json(setting);
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();
    if (!data.user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }
    const user_id = data.user_id.split('@')[0];

    // If only updating semesterStart/semesterEnd, allow partial update
    if ('semesterStart' in data || 'semesterEnd' in data) {
      const update: any = {};
      if ('semesterStart' in data) update.semesterStart = data.semesterStart;
      if ('semesterEnd' in data) update.semesterEnd = data.semesterEnd;
      const saved = await Setting.findOneAndUpdate(
        { user_id },
        { $set: update },
        { upsert: true, new: true }
      );
      return NextResponse.json(saved);
    }

    // Otherwise, do full validation
    const validation = validateSettings(data);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: "Invalid settings data", 
        details: validation.errors 
      }, { status: 400 });
    }

    const saved = await saveSetting({ ...data, user_id } as SettingType);

    if (!saved) {
      return NextResponse.json({ 
        error: "Failed to save settings" 
      }, { status: 500 });
    }

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ 
      error: "Internal server error while saving settings" 
    }, { status: 500 });
  }
} 