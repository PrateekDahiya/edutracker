import { addActivity } from "./activityService";

export type ClassType = "lab" | "lecture";
export interface Class {
    _id?: string;
    user_id: string;
    course_id: string;
    courseName: string;
    day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
    startTime: string; 
    endTime: string;
    type: ClassType;
    instructor: string;
    room: string;
    color?: string;
}

const API_URL = '/api/schedule';

export async function getClasses(user_id: string): Promise<Class[]> {
    const res = await fetch(`${API_URL}?user_id=${encodeURIComponent(user_id)}`);
    if (!res.ok) throw new Error('Failed to fetch classes');
    return res.json();
}

export async function addClass(cls: Omit<Class, '_id'>): Promise<Class> {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cls),
    });
    if (!res.ok) throw new Error('Failed to add class');
    return res.json();
}

export async function updateClass(id: string, updates: Partial<Class>): Promise<Class> {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update class');
    return res.json();
}

export async function deleteClass(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete class');
    return res.json();
} 