import { User } from "../models/User";

export async function getUserByEmail(email: string) {
  return await User.findOne({ email });
}
 
export async function updateUserProfile(email: string, updates: Record<string, unknown>) {
  const user_id = (updates.user_id as string) || (email ? email.split('@')[0] : '');
  return await User.findOneAndUpdate({ email }, { ...updates, user_id }, { new: true });
} 