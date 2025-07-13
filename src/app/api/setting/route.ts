import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/models/db";
import { getSetting, saveSetting, SettingType } from "@/services/settingService";

// Validation function for settings
function validateSettings(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.user_id || typeof data.user_id !== 'string') {
    errors.push('user_id is required and must be a string');
  }
  
  if (typeof data.lectureDuration !== 'number' || data.lectureDuration < 30 || data.lectureDuration > 180) {
    errors.push('lectureDuration must be a number between 30 and 180');
  }
  
  if (typeof data.labDuration !== 'number' || data.labDuration < 30 || data.labDuration > 240) {
    errors.push('labDuration must be a number between 30 and 240');
  }
  
  if (typeof data.notifSound !== 'boolean') {
    errors.push('notifSound must be a boolean');
  }
  
  if (!['12h', '24h'].includes(data.timeFormat)) {
    errors.push('timeFormat must be either "12h" or "24h"');
  }
  
  if (!['light', 'dark', 'system'].includes(data.theme)) {
    errors.push('theme must be either "light", "dark", or "system"');
  }
  
  return { isValid: errors.length === 0, errors };
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    
    if (!user_id) {
      return NextResponse.json({ 
        error: "Missing user_id parameter" 
      }, { status: 400 });
    }
    
    const setting = await getSetting(user_id);
    
    if (!setting) {
      return NextResponse.json({ 
        error: "Settings not found for this user" 
      }, { status: 404 });
    }
    
    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ 
      error: "Internal server error while fetching settings" 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();
    
    // Validate required fields
    if (!data.user_id) {
      return NextResponse.json({ 
        error: "Missing user_id" 
      }, { status: 400 });
    }
    
    // Validate settings data
    const validation = validateSettings(data);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: "Invalid settings data", 
        details: validation.errors 
      }, { status: 400 });
    }
    
    const saved = await saveSetting(data as SettingType);
    
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