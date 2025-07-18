export type Priority = 'high' | 'medium' | 'low';
export type Task = {
    _id?: string;
    user_id: string;
    course_id: string;
    course: string;
    title: string;
    description: string;
    priority: Priority;
    due: string; // ISO string
    completed: boolean;
};

const API_URL = '/api/todo';

export async function getTasks(user_id: string, semester_id: string): Promise<Task[]> {
    const res = await fetch(`${API_URL}?user_id=${encodeURIComponent(user_id)}&semester_id=${encodeURIComponent(semester_id)}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
}

export async function addTask(task: Omit<Task, '_id'>, semester_id: string): Promise<Task> {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, semester_id }),
    });
    if (!res.ok) throw new Error('Failed to add task');
    return res.json();
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
}

export async function deleteTask(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
} 