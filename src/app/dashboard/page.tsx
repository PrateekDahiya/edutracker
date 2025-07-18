"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getCourses, Course } from "../../services/attendanceService";
import { getClasses, Class } from "../../services/scheduleService";
import { getTasks, Task } from "../../services/todoService";
import { useSettings } from "../components/SettingsProvider";

// Cache utility functions
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEYS = {
  DASHBOARD_DATA: 'dashboard_data',
  LAST_UPDATE: 'dashboard_last_update'
};

interface CachedData {
  courses: Course[];
  classes: Class[];
  tasks: Task[];
  timestamp: number;
}

function getCachedData(userId: string): CachedData | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEYS.DASHBOARD_DATA}_${userId}`);
    const lastUpdate = localStorage.getItem(`${CACHE_KEYS.LAST_UPDATE}_${userId}`);
    
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

function setCachedData(userId: string, data: CachedData): void {
  try {
    localStorage.setItem(`${CACHE_KEYS.DASHBOARD_DATA}_${userId}`, JSON.stringify(data));
    localStorage.setItem(`${CACHE_KEYS.LAST_UPDATE}_${userId}`, Date.now().toString());
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

function clearCache(userId: string): void {
  try {
    localStorage.removeItem(`${CACHE_KEYS.DASHBOARD_DATA}_${userId}`);
    localStorage.removeItem(`${CACHE_KEYS.LAST_UPDATE}_${userId}`);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

export default function Dashboard() {
  const { data: session } = useSession();
  const { settings } = useSettings();
  const [stats, setStats] = useState({
    courses: 0,
    classesToday: 0,
    tasksDue: 0,
    belowRequired: 0,
  });
  const [nextClass, setNextClass] = useState<Class | null>(null);
  const [upcomingTask, setUpcomingTask] = useState<Task | null>(null);
  const [attendanceData, setAttendanceData] = useState<Array<{
    courseName: string;
    percentage: number;
    attended: number;
    total: number;
    required: number;
  }>>([]);
  const [taskCompletion, setTaskCompletion] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]); // <-- Add this line
  const [showCharts, setShowCharts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Daily counter state
  const [counter, setCounter] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);

  // Helper: 12-hour to 24-hour
  function to24Hour(time12h: string) {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }
  // Helper: 24-hour to 12-hour
  function to12Hour(time24: string) {
    let [h, m] = time24.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` + ` ${ampm}`;
  }
  // Helper: format time for display based on settings
  function formatTime(time: string) {
    if (!settings) return time;
    if (settings.timeFormat === "24h") {
      // If already 24h, return as is, else convert
      if (/^\d{2}:\d{2}$/.test(time)) return time;
      return to24Hour(time);
    } else {
      // If already 12h, return as is, else convert
      if (/AM|PM/.test(time)) return time;
      return to12Hour(time);
    }
  }

  // Function to process data and update state
  const processData = useCallback((courses: Course[], classes: Class[], tasks: Task[]) => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    const classesToday = classes.filter((cls) => {
      const weekday = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][today.getDay()];
      return cls.day === weekday;
    });
    
    const tasksDue = tasks.filter((t) => {
      if (!t.due) return false;
      const dueDate = new Date(t.due);
      return dueDate.toISOString().slice(0, 10) === todayStr;
    });
    
    const belowRequired = courses.filter((c) => {
      const percent = (c.at_class / (c.t_class || 1)) * 100;
      return percent < c.required;
    });

    setStats({
      courses: courses.length,
      classesToday: classesToday.length,
      tasksDue: tasksDue.length,
      belowRequired: belowRequired.length,
    });
    setTasks(tasks); // <-- Add this line

    // Next class calculation
    let nextCls: Class | null = null;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    
    const todayClasses = classesToday.map((cls) => {
      const [time, ampm] = cls.startTime.split(" ");
      let [h, m] = time.split(":").map(Number);
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      const classTimeMinutes = h * 60 + m;
      return { ...(cls as Class), classTimeMinutes, isToday: true } as Class & { classTimeMinutes: number; isToday: boolean };
    }).filter((cls) => (cls as { classTimeMinutes: number }).classTimeMinutes > currentTime);
    
    if (todayClasses.length > 0) {
      // Sort by time (earliest first)
      todayClasses.sort((a: Class & { classTimeMinutes: number }, b: Class & { classTimeMinutes: number }) => a.classTimeMinutes - b.classTimeMinutes);
      nextCls = todayClasses[0];
    } else {
      // If no classes today, find the next class in the week
      const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const currentDayIndex = now.getDay();
      
      // Check remaining days of the week
      for (let i = 1; i <= 7; i++) {
        const checkDayIndex = (currentDayIndex + i) % 7;
        const checkDay = weekdays[checkDayIndex];
        if (checkDay === "sunday" || checkDay === "saturday") continue; // Skip weekends
        const classesOnDay = classes.filter((cls) => cls.day === checkDay);
        if (classesOnDay.length > 0) {
          // Sort by time and take the first one
          const sortedClasses = classesOnDay.map((cls) => {
            const [time, ampm] = cls.startTime.split(" ");
            let [h, m] = time.split(":").map(Number);
            if (ampm === "PM" && h !== 12) h += 12;
            if (ampm === "AM" && h === 12) h = 0;
            return { ...cls, classTimeMinutes: h * 60 + m };
          }).sort((a: Class & { classTimeMinutes: number }, b: Class & { classTimeMinutes: number }) => a.classTimeMinutes - b.classTimeMinutes);
          nextCls = sortedClasses[0];
          break;
        }
      }
    }
    setNextClass(nextCls);

    // Upcoming task calculation
    let nextTask: Task | null = null;
    const futureTasks = tasks.filter((t) => t.due && new Date(t.due) > now && !t.completed);
    if (futureTasks.length > 0) {
      futureTasks.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
      nextTask = futureTasks[0];
    }
    setUpcomingTask(nextTask);

    // Attendance chart data
    const attendanceChartData = courses.map((c) => ({
      courseName: c.course_name,
      percentage: Math.round((c.at_class / (c.t_class || 1)) * 100),
      attended: c.at_class,
      total: c.t_class,
      required: c.required,
    }));
    setAttendanceData(attendanceChartData);

    // Task completion
    const completed = tasks.filter((t) => t.completed).length;
    setTaskCompletion(tasks.length ? Math.round((completed / tasks.length) * 100) : 0);
  }, []);

  // Function to fetch data from API
  const fetchDataFromAPI = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const semester_id = settings?.semesterStart && settings?.semesterEnd ? `${settings.semesterStart}_${settings.semesterEnd}` : '';
      const [courses, classes, tasks] = await Promise.all([
        getCourses(userId, semester_id),
        getClasses(userId, semester_id),
        getTasks(userId, semester_id),
      ]);

      const cachedData: CachedData = {
        courses,
        classes,
        tasks,
        timestamp: Date.now()
      };

      // Store in cache
      setCachedData(userId, cachedData);
      
      // Process the data
      processData(courses, classes, tasks);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [processData, settings]);

  // Function to load data (from cache or API)
  const loadData = useCallback(async (userId: string) => {
    // Try to get cached data first
    const cachedData = getCachedData(userId);
    
    if (cachedData) {
      // Use cached data
      processData(cachedData.courses, cachedData.classes, cachedData.tasks);
      setLastUpdate(new Date(cachedData.timestamp));
      
      // Update in background if cache is getting old (after 3 minutes)
      const now = Date.now();
      if (now - cachedData.timestamp > 3 * 60 * 1000) {
        // Fetch fresh data in background
        fetchDataFromAPI(userId);
      }
    } else {
      // No cache or expired, fetch from API
      await fetchDataFromAPI(userId);
    }
  }, [processData, fetchDataFromAPI]);

  // Main effect to load data
  const user_id = session?.user?.email ? session.user.email.split('@')[0] : '';
  useEffect(() => {
    if (!user_id) return;
    loadData(user_id);
    setTimeout(() => setShowCharts(true), 400);
  }, [user_id, loadData]);

  // Function to force refresh (for manual refresh)
  const forceRefresh = useCallback(() => {
    if (!user_id) return;
    clearCache(user_id);
    fetchDataFromAPI(user_id);
  }, [user_id, fetchDataFromAPI]);

  // Set up periodic refresh (every 10 minutes)
  useEffect(() => {
    if (!user_id) return;
    const interval = setInterval(() => {
      fetchDataFromAPI(user_id);
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [user_id, fetchDataFromAPI]);

  // Load counter from localStorage on mount
  useEffect(() => {
    const savedCounter = localStorage.getItem('dailyCounter');
    const savedStartDate = localStorage.getItem('counterStartDate');
    const savedIsRunning = localStorage.getItem('counterIsRunning');
    
    if (savedCounter) {
      setCounter(parseInt(savedCounter));
    }
    if (savedStartDate) {
      setStartDate(new Date(savedStartDate));
    }
    if (savedIsRunning === 'true') {
      setIsRunning(true);
    }
  }, []);

  // Update counter daily when running
  useEffect(() => {
    if (!isRunning || !startDate) return;

    const checkAndUpdateCounter = () => {
      const now = new Date();
      const start = new Date(startDate);
      const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > counter) {
        setCounter(daysDiff);
        localStorage.setItem('dailyCounter', daysDiff.toString());
      }
    };

    // Check immediately
    checkAndUpdateCounter();
    
    // Check every hour
    const interval = setInterval(checkAndUpdateCounter, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, startDate, counter]);

  // Counter control functions
  const startCounter = () => {
    const now = new Date();
    setStartDate(now);
    setIsRunning(true);
    setCounter(0);
    localStorage.setItem('dailyCounter', '0');
    localStorage.setItem('counterStartDate', now.toISOString());
    localStorage.setItem('counterIsRunning', 'true');
  };

  const stopCounter = () => {
    setIsRunning(false);
    localStorage.setItem('counterIsRunning', 'false');
  };

  const resetCounter = () => {
    setCounter(0);
    setIsRunning(false);
    setStartDate(null);
    localStorage.removeItem('dailyCounter');
    localStorage.removeItem('counterStartDate');
    localStorage.removeItem('counterIsRunning');
  };

  if (!session || !session.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-[var(--danger)] font-bold">Please log in to access the dashboard.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text)]">Dashboard</h1>
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
      
      {/* Loading State */}
      {loading && (
        <div className="mb-4 p-3 sm:p-4 bg-[var(--bg-light)] rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-[var(--primary)]"></div>
            <span className="text-sm sm:text-base text-[var(--text-muted)]">Updating dashboard data...</span>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: 'Courses', value: stats.courses, color: 'text-[var(--primary)]' },
          { label: 'Classes Today', value: stats.classesToday, color: 'text-[var(--primary)]' },
          { label: 'Tasks Due', value: stats.tasksDue, color: 'text-[var(--primary)]' },
        ].map((card, i) => (
          <div
            key={card.label}
            className="bg-[var(--bg-light)] rounded-xl p-3 sm:p-5 shadow flex flex-col items-center group transition-transform duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer relative overflow-hidden"
          >
            <span
              className={`text-2xl sm:text-3xl font-bold ${card.color} transition-transform duration-500 group-hover:scale-125 animate-pop`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {card.value}
            </span>
            <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 transition-colors duration-300 group-hover:text-[var(--primary)] text-center">{card.label}</span>
            {/* Animated background effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-[var(--primary)] to-[var(--danger)] pointer-events-none" />
          </div>
        ))}
        
        {/* Daily Counter Card */}
        <div className="bg-[var(--bg-light)] rounded-xl p-3 sm:p-5 shadow flex flex-col items-center group transition-transform duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer relative overflow-hidden">
          <span
            className={`text-2xl sm:text-3xl font-bold text-[var(--primary)] transition-transform duration-500 group-hover:scale-125 animate-pop`}
            style={{ animationDelay: '0.3s' }}
          >
            {counter}
          </span>
          <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 transition-colors duration-300 group-hover:text-[var(--primary)] text-center">
            {isRunning ? 'Days Running' : 'Daily Counter'}
          </span>
          
          {/* Control buttons - show on hover */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1 sm:gap-2">
            {!isRunning ? (
              <button
                onClick={startCounter}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[var(--success)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--success)]/90 transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                Start
              </button>
            ) : (
              <button
                onClick={stopCounter}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[var(--danger)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--danger)]/90 transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                Stop
              </button>
            )}
            <button
              onClick={resetCounter}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[var(--text-muted)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--text-muted)]/90 transition-all duration-200 hover:scale-105 cursor-pointer"
            >
              Reset
            </button>
          </div>
          
          {/* Animated background effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-[var(--primary)] to-[var(--danger)] pointer-events-none" />
        </div>
      </div>

      {/* Next Class & Upcoming Task Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-[var(--bg-light)] rounded-xl p-4 sm:p-6 shadow flex flex-col group transition-transform duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <span className="text-[var(--text-muted)] text-xs sm:text-sm mb-1">Next Class</span>
          <span className="font-bold text-base sm:text-lg text-[var(--text)] group-hover:text-[var(--primary)] transition-colors duration-300 animate-fadein">
            {nextClass ? nextClass.courseName : "-"}
          </span>
          <span className="text-xs sm:text-sm text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors duration-300 animate-fadein">
            {nextClass ? (
              (nextClass as Class & { isToday: boolean }).isToday ? 
                `${formatTime(nextClass.startTime)} • ${nextClass.room}` :
                `${nextClass.day.charAt(0).toUpperCase() + nextClass.day.slice(1)} • ${formatTime(nextClass.startTime)} • ${nextClass.room}`
            ) : "-"}
          </span>
        </div>
        <div className="bg-[var(--bg-light)] rounded-xl p-4 sm:p-6 shadow flex flex-col group transition-transform duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <span className="text-[var(--text-muted)] text-xs sm:text-sm mb-1">Upcoming Task</span>
          <span className="font-bold text-base sm:text-lg text-[var(--text)] group-hover:text-[var(--primary)] transition-colors duration-300 animate-fadein">
            {upcomingTask ? upcomingTask.title : "-"}
          </span>
          <span className="text-xs sm:text-sm text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors duration-300 animate-fadein">
            {upcomingTask ? `${upcomingTask.course} • ${new Date(upcomingTask.due).toLocaleString()}` : "-"}
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Attendance Overview as Vertical Bar Graph */}
        <div className={`bg-[var(--bg-light)] rounded-xl p-4 sm:p-6 shadow flex flex-col group transition-transform duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer transition-all duration-700 ${showCharts ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="font-bold text-sm sm:text-base text-[var(--text)] mb-3 sm:mb-4">Attendance Overview</span>
          {attendanceData.length > 0 ? (
            <div className="flex items-end justify-center gap-3 sm:gap-5 h-40 sm:h-56 w-full px-2 mt-6 sm:mt-8 relative">
              {attendanceData.map((course, i) => (
                <div key={i} className="flex flex-col items-center w-12 sm:w-16 group/item">
                  {/* Bar */}
                  <div className="relative flex items-end w-full h-32 sm:h-44">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-700 ${
                        course.percentage >= course.required ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
                      } animate-barGrow`}
                      style={{
                        height: showCharts ? `${course.percentage}%` : '0%',
                        minHeight: '8px',
                        transitionDelay: `${i * 0.1}s`,
                        maxHeight: '100%',
                      }}
                    ></div>
                    {/* Percentage label above bar, with extra space to avoid cutoff */}
                    <span className={`absolute -top-8 left-1/2 -translate-x-1/2 text-xs sm:text-sm font-bold ${
                      course.percentage >= course.required ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                    }`}>
                      {course.percentage}%
                    </span>
                  </div>
                  {/* Course name below bar */}
                  <span className="mt-2 text-xs sm:text-sm font-medium text-[var(--text)] truncate text-center max-w-full" title={course.courseName}>
                    {course.courseName}
                  </span>
                  {/* Attended/total below name */}
                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)] text-center">{course.attended}/{course.total}</span>
                  {/* Required % below attended/total */}
                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)] text-center">Req: {course.required}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[var(--text-muted)] py-6 sm:py-8">
              <span className="text-xs sm:text-sm">No courses found</span>
            </div>
          )}
        </div>
        {/* Task Completion Pie Chart (unchanged) */}
        <div className={`bg-[var(--bg-light)] rounded-xl p-4 sm:p-6 shadow flex flex-col items-center group transition-transform duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer transition-all duration-700 ${showCharts ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="font-bold text-sm sm:text-base text-[var(--text)] mb-2">Task Completion</span>
          {/* Pie chart */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 group-hover:animate-spin-slow">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#eee" strokeWidth="4" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="var(--success)" strokeWidth="4" strokeDasharray={`${taskCompletion},${100-taskCompletion}`} strokeDashoffset="0" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm sm:text-lg font-bold text-[var(--success)] animate-pop">
              {taskCompletion}%
            </span>
          </div>
          {/* Pending Tasks List */}
          <div className="w-full mt-4">
            <span className="block text-xs sm:text-sm font-semibold text-[var(--text-muted)] mb-1 text-center">Pending Tasks</span>
            {(() => {
              // Get up to 5 pending tasks, sorted by due date (soonest first, undated last)
              const pendingTasks = tasks
                .filter((t) => !t.completed)
                .sort((a, b) => {
                  if (a.due && b.due) return new Date(a.due).getTime() - new Date(b.due).getTime();
                  if (a.due) return -1;
                  if (b.due) return 1;
                  return 0;
                })
                .slice(0, 5);
              if (pendingTasks.length === 0) {
                return <div className="text-xs text-[var(--text-muted)] text-center py-2">All tasks completed! 🎉</div>;
              }
              return (
                <ul className="flex flex-col gap-1">
                  {pendingTasks.map((task) => (
                    <li key={task._id || task.title} className="flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--bg)] transition-colors text-xs sm:text-sm">
                      <span className="truncate max-w-[60%]" title={task.title}>{task.title}</span>
                      <span className="text-[var(--text-muted)] ml-2 whitespace-nowrap">
                        {task.due ? new Date(task.due).toLocaleDateString() : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes pop {
          0% { transform: scale(0.7); opacity: 0.5; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop { animation: pop 0.5s cubic-bezier(.4,2,.6,1) both; }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadein { animation: fadein 0.7s cubic-bezier(.4,2,.6,1) both; }
        @keyframes barGrow {
          from { height: 0; }
          to { height: var(--bar-height, 100%); }
        }
        .animate-barGrow { animation: barGrow 1s cubic-bezier(.4,2,.6,1) both; }
        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 2s linear infinite; }
      `}</style>
    </div>
  );
}
