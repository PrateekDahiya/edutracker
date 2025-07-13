import { addActivity } from "./activityService";

export type Attendance = {
  _id?: string;
  user_id: string;
  course_name: string;
  course_id: string;
  instructor: string;
  weekly: number;
  type: 'lecture' | 'lab';
  required: number;
  at_class: number;
  t_class: number;
  status?: string;
};

export type Course = {
    _id?: string;
    user_id: string;
    course_name: string;
    course_id: string;
    instructor: string;
    weekly: number;
    type: 'lecture' | 'lab';
    required: number;
    at_class: number;
    t_class: number;
};

const API_URL = '/api/attendance';

export async function getCourses(user_id: string): Promise<Course[]> {
    const res = await fetch(`/api/attendance?user_id=${encodeURIComponent(user_id)}`);
    if (!res.ok) throw new Error('Failed to fetch courses');
    return res.json();
}

export async function addCourse(course: Omit<Course, '_id'>): Promise<Course> {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course),
    });
    if (!res.ok) throw new Error('Failed to add course');
    return res.json();
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update course');
    return res.json();
}

export async function deleteCourse(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete course');
    return res.json();
}

export async function addAttendance(user_id: string, attendance: Attendance) {
  const res = await fetch("/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...attendance, user_id }),
  });
  return res.json();
} 