import { User } from "../models/User";

export async function getUserByEmail(email: string) {
  return await User.findOne({ email });
}
 
export async function updateUserProfile(email: string, updates: any) {
  return await User.findOneAndUpdate({ email }, updates, { new: true });
} 