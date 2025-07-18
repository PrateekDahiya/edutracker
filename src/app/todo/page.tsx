"use client";
import { useState, useEffect, useCallback } from "react";
import { getTasks, addTask, updateTask, deleteTask, Task, Priority } from "../../services/todoService";
import { getCourses, Course } from "../../services/attendanceService";
import { useSession } from "next-auth/react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAlert } from "../components/AlertPopup";
import { useConfirm } from "../components/ConfirmDialog";
import { useSettings } from "../components/SettingsProvider";

// Cache utility functions
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEYS = {
  TODO_DATA: 'todo_data',
  TODO_COURSES: 'todo_courses',
  LAST_UPDATE: 'todo_last_update'
};

interface CachedData {
  tasks: Task[];
  courses: Course[];
  timestamp: number;
}

function getCachedData(userEmail: string): CachedData | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEYS.TODO_DATA}_${userEmail}`);
    const lastUpdate = localStorage.getItem(`${CACHE_KEYS.LAST_UPDATE}_${userEmail}`);
    
    if (!cached || !lastUpdate) return null;
    
    const data: CachedData = JSON.parse(cached);
    const lastUpdateTime = parseInt(lastUpdate);
    const now = Date.now();
    
    // Check if cache is still valid (within 5 minutes)
    if (now - lastUpdateTime < CACHE_DURATION) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

function setCachedData(userEmail: string, data: CachedData): void {
  try {
    localStorage.setItem(`${CACHE_KEYS.TODO_DATA}_${userEmail}`, JSON.stringify(data));
    localStorage.setItem(`${CACHE_KEYS.LAST_UPDATE}_${userEmail}`, Date.now().toString());
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

function clearCache(userEmail: string): void {
  try {
    localStorage.removeItem(`${CACHE_KEYS.TODO_DATA}_${userEmail}`);
    localStorage.removeItem(`${CACHE_KEYS.LAST_UPDATE}_${userEmail}`);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

const priorities: { label: string; value: Priority; color: string }[] = [
    { label: 'High', value: 'high', color: 'red' },
    { label: 'Medium', value: 'medium', color: 'yellow' },
    { label: 'Low', value: 'low', color: 'green' },
];

// Helper for priority color
const priorityStyles = {
  high: 'border-l-2 border-red-300 shadow-[inset_8px_0_16px_-8px_rgba(239,68,68,0.06)]',
  medium: 'border-l-2 border-yellow-200 shadow-[inset_8px_0_16px_-8px_rgba(251,191,36,0.04)]',
  low: 'border-l-2 border-green-200 shadow-[inset_8px_0_16px_-8px_rgba(34,197,94,0.04)]',
};

export default function ToDo() {
    const { data: session } = useSession();
    const { settings } = useSettings();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        course: '',
        course_id: '',
        priority: 'medium' as Priority,
        due: '',
    });
    const [expanded, setExpanded] = useState<{ [course: string]: boolean }>({});
    const [showAll, setShowAll] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const { showAlert, AlertComponent } = useAlert();
    const { showConfirm, ConfirmComponent } = useConfirm();

    const semester_id = settings?.semesterStart && settings?.semesterEnd ? `${settings.semesterStart}_${settings.semesterEnd}` : '';
    const user_id = session?.user?.email ? session.user.email.split('@')[0] : '';

    // Function to fetch data from API
    const fetchDataFromAPI = useCallback(async (userEmail: string) => {
        setLoading(true);
        try {
            const [tasksData, coursesData] = await Promise.all([
                getTasks(userEmail, semester_id),
                getCourses(userEmail, semester_id)
            ]);
            
            const cachedData: CachedData = {
                tasks: tasksData,
                courses: coursesData,
                timestamp: Date.now()
            };

            // Store in cache
            setCachedData(userEmail, cachedData);
            
            // Update state
            setTasks(tasksData);
            setCourses(coursesData);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching todo data:', error);
        } finally {
            setLoading(false);
        }
    }, [semester_id]);

    // Function to load data (from cache or API)
    const loadData = useCallback(async (userEmail: string) => {
        // Try to get cached data first
        const cachedData = getCachedData(userEmail);
        
        if (cachedData) {
            // Use cached data
            setTasks(cachedData.tasks);
            setCourses(cachedData.courses);
            setLastUpdate(new Date(cachedData.timestamp));
            setLoading(false); // Set loading to false when using cached data
            
            // Update in background if cache is getting old (after 3 minutes)
            const now = Date.now();
            if (now - cachedData.timestamp > 3 * 60 * 1000) {
                // Fetch fresh data in background
                fetchDataFromAPI(userEmail);
            }
        } else {
            // No cache or expired, fetch from API
            await fetchDataFromAPI(userEmail);
        }
    }, [fetchDataFromAPI]);

    // Main effect to load data
    useEffect(() => {
        const userEmail = session && session.user && typeof session.user.email === "string" ? session.user.email : undefined;
        if (!userEmail) return;
        
        loadData(userEmail);
    }, [session, loadData]);

    // Function to force refresh (for manual refresh)
    const forceRefresh = useCallback(() => {
        const userEmail = session && session.user && typeof session.user.email === "string" ? session.user.email : undefined;
        if (!userEmail) return;
        
        clearCache(userEmail);
        fetchDataFromAPI(userEmail);
    }, [session, fetchDataFromAPI]);

    // Set up periodic refresh (every 10 minutes)
    useEffect(() => {
        const userEmail = session && session.user && typeof session.user.email === "string" ? session.user.email : undefined;
        if (!userEmail) return;

        const interval = setInterval(() => {
            fetchDataFromAPI(userEmail);
        }, 10 * 60 * 1000); // 10 minutes

        return () => clearInterval(interval);
    }, [session, fetchDataFromAPI]);

    function openModal() {
        setForm({ title: '', description: '', course: '', course_id: '', priority: 'medium', due: '' });
        setShowModal(true);
    }
    function closeModal() {
        setShowModal(false);
    }

    // Handlers
    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    }
    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title || !form.course || !form.course_id || !form.due || !session?.user?.email || !semester_id) return;
        const newTask: Omit<Task, '_id'> = {
            user_id: user_id,
            course_id: form.course_id,
            course: form.course,
            title: form.title,
            description: form.description,
            priority: form.priority,
            due: form.due,
            completed: false,
        };
        const created = await addTask(newTask, semester_id);
        setTasks(prev => [...prev, created]);
        // Clear cache to force fresh data
        clearCache(session.user.email);
        closeModal();
    }
    async function toggleComplete(id: string) {
        const task = tasks.find(t => t._id === id);
        if (!task) return;
        const updated = await updateTask(id, { completed: !task.completed });
        setTasks(prev => prev.map(t => t._id === id ? updated : t));
        // Clear cache to force fresh data
        const userEmail = session?.user?.email;
        if (userEmail) clearCache(userEmail);
    }
    async function handleUndo(id: string) {
        const task = tasks.find(t => t._id === id);
        if (!task) return;
        const updated = await updateTask(id, { completed: false });
        setTasks(prev => prev.map(t => t._id === id ? updated : t));
        // Clear cache to force fresh data
        const userEmail = session?.user?.email;
        if (userEmail) clearCache(userEmail);
    }

    async function handleDelete(id: string) {
        const task = tasks.find(t => t._id === id);
        if (!task) return;
        
        showConfirm(
            `Are you sure you want to delete "${task.title}"?`,
            async () => {
                try {
                    await deleteTask(id);
                    setTasks(prev => prev.filter(t => t._id !== id));
                    // Clear cache to force fresh data
                    const userEmail = session?.user?.email;
                    if (userEmail) clearCache(userEmail);
                    showAlert("Task deleted successfully!", "success");
                } catch (err) {
                    showAlert("Error deleting task", "error");
                }
            },
            {
                title: "Delete Task",
                confirmText: "Delete",
                cancelText: "Cancel",
                type: "danger"
            }
        );
    }

    // Overdue check
    function isOverdue(task: Task) {
        if (typeof window === 'undefined') return false;
        return !task.completed && new Date(task.due) < new Date();
    }

    // Collapsible logic
    function toggleExpand(course: string) {
        setExpanded(prev => ({ ...prev, [course]: !prev[course] }));
    }

    // Filtered tasks
    const filteredTasks = tasks.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'completed') return t.completed;
        if (filter === 'incomplete') return !t.completed;
        return true;
    });
    // Get unique courses from filtered tasks
    const uniqueCourses = Array.from(new Set(filteredTasks.map(t => t.course))).filter(Boolean);
    // Group filtered tasks by course
    const grouped: { course: string; tasks: Task[] }[] = uniqueCourses.map((course: string) => ({
        course,
        tasks: filteredTasks.filter((t: Task) => t.course === course).sort(sortTasks),
    }));

    // Sort helpers
    function sortTasks(a: Task, b: Task) {
        const pOrder = { high: 0, medium: 1, low: 2 };
        if (a.priority !== b.priority) return pOrder[a.priority] - pOrder[b.priority];
        // Only sort by date if running on client
        if (typeof window !== 'undefined') {
            return new Date(a.due).getTime() - new Date(b.due).getTime();
        }
        return 0;
    }

    // Unified view
    const allTasks: Task[] = [...tasks].sort(sortTasks);

    // Helper: format time for display based on settings
    function formatTime(dateString: string) {
        if (!settings) return dateString;
        const date = new Date(dateString);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        // These can be const since not reassigned
        const pad = (n: number) => n.toString().padStart(2, "0");
        if (settings.timeFormat === "24h") {
            return `${pad(hours)}:${pad(minutes)}`;
        } else {
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12;
            return `${pad(hours)}:${pad(minutes)} ${ampm}`;
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text)]">To-Do List</h1>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    {lastUpdate && (
                        <span className="text-xs sm:text-sm text-[var(--text-muted)] order-2 sm:order-1">
                            Last updated: {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={forceRefresh}
                        disabled={loading}
                        className="px-3 sm:px-4 py-2 rounded-xl bg-[var(--btn-bg)] text-[var(--btn-text)] text-sm sm:text-base font-semibold cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 ring-2 ring-transparent focus:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                    >
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>
            
            {loading && (
                <div className="mb-4 p-4 bg-[var(--bg-light)] rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]"></div>
                        <span className="text-[var(--text-muted)]">Updating todo data...</span>
                    </div>
                </div>
            )}
            
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg)]/60">
                    <LoadingSpinner />
                </div>
            )}
            
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto h-screen bg-[var(--bg-dark)]/90 backdrop-blur-sm">
                    <div className="bg-[var(--bg-light)] rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-sm sm:max-w-md mx-2 sm:mx-4 mt-4 sm:mt-8 max-h-[calc(100vh-32px)] sm:max-h-[calc(100vh-48px)] overflow-y-auto border border-[var(--border)] scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                        <style>{` .scrollbar-none::-webkit-scrollbar { display: none; } `}</style>
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">Add Task</h2>
                            <button
                                onClick={closeModal}
                                className="text-xl sm:text-2xl text-[var(--text-muted)] hover:text-[var(--danger)] hover:scale-110 hover:-translate-y-1 focus:scale-110 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleAdd} className="space-y-4 sm:space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[var(--text)] font-semibold text-sm sm:text-base">Task Title</label>
                                <input 
                                    name="title" 
                                    value={form.title} 
                                    onChange={handleChange} 
                                    placeholder="Enter task title"
                                    className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                                    required 
                                />
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-[var(--text)] font-semibold text-sm sm:text-base">Related Course</label>
                                <select
                                    name="course_id"
                                    value={form.course_id}
                                    onChange={e => {
                                        const selected = courses.find(c => c.course_id === e.target.value);
                                        setForm(f => ({ ...f, course_id: e.target.value, course: selected ? selected.course_name : '' }));
                                    }}
                                    className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                                    required
                                >
                                    <option value="">Select Related Course</option>
                                    {courses.map(c => (
                                        <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-[var(--text)] font-semibold text-sm sm:text-base">Description</label>
                                <textarea 
                                    name="description" 
                                    value={form.description} 
                                    onChange={handleChange} 
                                    placeholder="Enter task description"
                                    className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer resize-none"
                                    rows={3}
                                />
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-[var(--text)] font-semibold text-sm sm:text-base">Priority</label>
                                <select 
                                    name="priority" 
                                    value={form.priority} 
                                    onChange={handleChange} 
                                    className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                                >
                                    {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-[var(--text)] font-semibold text-sm sm:text-base">Due Date & Time</label>
                                <input 
                                    name="due" 
                                    type="datetime-local" 
                                    value={form.due} 
                                    onChange={handleChange} 
                                    className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                                    required 
                                />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                                <button 
                                    type="submit" 
                                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent focus:ring-[var(--primary)]"
                                >
                                    Add Task
                                </button>
                                <button 
                                    type="button" 
                                    onClick={closeModal} 
                                    className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-light)] font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent focus:ring-[var(--border)]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <div className="flex gap-2 mb-4">
                <button onClick={() => setShowAll(false)} className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 cursor-pointer ${!showAll ? 'bg-[var(--primary)] text-[var(--btn-text)] shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--primary)]' : 'bg-[var(--bg-light)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--border)]'}`}>By Course</button>
                <button onClick={() => setShowAll(true)} className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 cursor-pointer ${showAll ? 'bg-[var(--primary)] text-[var(--btn-text)] shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--primary)]' : 'bg-[var(--bg-light)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--border)]'}`}>All Tasks</button>
                <button onClick={openModal} className="ml-auto px-4 py-2 rounded-xl bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 ring-2 ring-transparent focus:ring-[var(--primary)]">Add Task</button>
            
            </div>
            <div className="flex flex-wrap gap-2 mb-6 sm:flex-row xs:flex-col xs:gap-1 xs:mb-4 xs:w-full">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 cursor-pointer w-full xs:w-full sm:w-auto ${filter === 'all' ? 'bg-[var(--primary)] text-[var(--btn-text)] shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--primary)]' : 'bg-[var(--bg-light)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--border)]'}`}>All</button>
                <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 cursor-pointer w-full xs:w-full sm:w-auto ${filter === 'completed' ? 'bg-[var(--primary)] text-[var(--btn-text)] shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--primary)]' : 'bg-[var(--bg-light)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--border)]'}`}>Completed</button>
                <button onClick={() => setFilter('incomplete')} className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 cursor-pointer w-full xs:w-full sm:w-auto ${filter === 'incomplete' ? 'bg-[var(--primary)] text-[var(--btn-text)] shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--primary)]' : 'bg-[var(--bg-light)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--border)]'}`}>Incomplete</button>
            </div>
            {!loading && tasks.length === 0 && (
                <div className="text-center text-[var(--text-muted)] py-8 text-lg">No tasks found.</div>
            )}
            {!showAll ? (
                <div className="space-y-4 sm:space-y-6">
                    {grouped.map(group => (
                        <div key={group.course} className="bg-[var(--bg-light)] rounded-xl shadow">
                            <button onClick={() => toggleExpand(group.course)} className="w-full text-left px-3 sm:px-4 py-2 font-bold text-base sm:text-lg text-[var(--text)] flex items-center justify-between cursor-pointer hover:bg-[var(--primary)]/10 transition">
                                {group.course}
                                <span className="text-xs text-[var(--text-muted)]">{expanded[group.course] !== false ? '▼' : '►'}</span>
                            </button>
                            {expanded[group.course] !== false && (
                                <div className="divide-y divide-[var(--border-muted)]">
                                    {group.tasks.map(task => (
                                        <div key={task._id} className={`flex flex-col md:flex-row md:items-center gap-2 p-3 sm:p-4 ${priorityStyles[task.priority]} ${task.completed ? 'opacity-50' : ''} group hover:scale-[1.03] shadow-lg transition cursor-pointer bg-[var(--bg-light)] rounded-xl`}>
                                            <div className="flex-1">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                                                    <span className={`font-bold ${task.completed ? 'line-through' : ''} text-[var(--text)] text-base sm:text-lg`}>{task.title}</span>
                                                    <span className={`ml-0 sm:ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-${priorities.find(p => p.value === task.priority)?.color}-500/20 text-${priorities.find(p => p.value === task.priority)?.color}-700`}>{priorities.find(p => p.value === task.priority)?.label}</span>
                                                    <span className="ml-0 sm:ml-2 text-xs text-[var(--text-muted)]" suppressHydrationWarning={true}>{typeof window !== 'undefined' ? formatTime(task.due) : ''}</span>
                                                </div>
                                                {!task.completed && <div className="text-[var(--text-muted)] text-xs sm:text-sm mt-1">{task.description}</div>}
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                                {typeof task._id === 'string' && (!task.completed ? (
                                                    <button onClick={() => toggleComplete(task._id as string)} className="px-3 py-1 rounded-lg bg-[var(--success)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--success)]/90 transition-all duration-200 hover:scale-105 cursor-pointer">Mark Done</button>
                                                ) : (
                                                    <button onClick={() => handleUndo(task._id as string)} className="px-3 py-1 rounded-lg bg-[var(--primary)] text-[var(--btn-text)] text-xs sm:text-sm font-semibold hover:bg-[var(--primary)]/90 transition-all duration-200 hover:scale-105 cursor-pointer">Undo</button>
                                                ))}
                                                {typeof task._id === 'string' && (
                                                    <button onClick={() => handleDelete(task._id as string)} className="px-3 py-1 rounded-lg bg-[var(--danger)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--danger)]/80 transition-all duration-200 hover:scale-105 cursor-pointer">Delete</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {allTasks.map(task => (
                        <div key={task._id} className={`flex flex-col md:flex-row md:items-center gap-2 p-4 bg-[var(--bg-light)] rounded-xl shadow-lg ${priorityStyles[task.priority]} ${task.completed ? 'opacity-50' : ''} group hover:scale-[1.03] transition cursor-pointer`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${task.completed ? 'line-through' : ''} text-[var(--text)]`}>{task.title}</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-${priorities.find(p => p.value === task.priority)?.color}-500/20 text-${priorities.find(p => p.value === task.priority)?.color}-700`}>{priorities.find(p => p.value === task.priority)?.label}</span>
                                    <span className="ml-2 text-xs text-[var(--text-muted)]" suppressHydrationWarning={true}>{typeof window !== 'undefined' ? formatTime(task.due) : ''}</span>
                                </div>
                                {!task.completed && <div className="text-[var(--text-muted)] text-sm mt-1">{task.description}</div>}
                            </div>
                            <div className="flex gap-2 items-center">
                                {typeof task._id === 'string' && (!task.completed ? (
                                    <button onClick={() => toggleComplete(task._id as string)} className="px-3 py-1 rounded bg-[var(--success)] text-white hover:scale-105 transition cursor-pointer">Mark Complete</button>
                                ) : (
                                    <button onClick={() => handleUndo(task._id as string)} className="px-3 py-1 rounded bg-[var(--primary)] text-[var(--btn-text)] hover:scale-105 transition cursor-pointer">Undo</button>
                                ))}
                                {task.completed && typeof task._id === 'string' && <button onClick={() => handleUndo(task._id!)} className="px-3 py-1 rounded bg-[var(--primary)] text-[var(--btn-text)] hover:scale-105 transition cursor-pointer">Undo</button>}
                                <button 
                                    onClick={() => handleDelete(task._id!)} 
                                    className="px-3 py-1 rounded bg-[var(--danger)] text-white hover:scale-105 transition cursor-pointer"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <AlertComponent />
            <ConfirmComponent />
        </div>
    );
}
