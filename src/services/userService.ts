import { User } from "../models/User";

export async function getUserByEmail(email: string) {
  return await User.findOne({ email });
}
 
export async function updateUserProfile(email: string, updates: Record<string, unknown>) {
  const user_id = (updates.user_id as string) || (email ? email.split('@')[0] : '');
  return await User.findOneAndUpdate({ email }, { ...updates, user_id }, { new: true });
}

export async function getUserCounter(email: string) {
  const user = await User.findOne({ email });
  if (!user) return { counter: 0, counterStartDate: null };
  return { counter: user.counter || 0, counterStartDate: user.counterStartDate || null };
}

export async function updateUserCounter(email: string, counter: number, counterStartDate?: Date) {
  return await User.findOneAndUpdate(
    { email },
    { counter, counterStartDate },
    { new: true }
  );
} 