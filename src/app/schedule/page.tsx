"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getClasses, updateClass as updateClassAPI, deleteClass as deleteClassAPI, Class, ClassType, addClass as addClassAPI } from "../../services/scheduleService";
import { useSession } from "next-auth/react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAlert } from "../components/AlertPopup";
import { useConfirm } from "../components/ConfirmDialog";
import { useSettings } from "../components/SettingsProvider";

export default function Schedule() {
    const { data: session } = useSession();
    const { settings } = useSettings();
    // Persistent state for classes
    const [classes, setClasses] = useState<Class[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<Partial<Class> & { originalId?: string }>({
        courseName: "",
        day: "monday",
        startTime: "",
        type: "lecture",
        instructor: "",
        room: "",
    });
    const infoRef = useRef<HTMLSpanElement>(null);
    const [jsDay, setJsDay] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const { showAlert, AlertComponent } = useAlert();
    const { showConfirm, ConfirmComponent } = useConfirm();

    const user_id = session?.user?.email ? session.user.email.split('@')[0] : '';
    const semester_id = settings?.semesterStart && settings?.semesterEnd ? `${settings.semesterStart}_${settings.semesterEnd}` : '';

    // Load from MongoDB on mount
    useEffect(() => {
        if (session?.user?.email && semester_id) {
            setLoading(true);
            getClasses(user_id, semester_id).then(setClasses).finally(() => setLoading(false));
        }
    }, [session, semester_id]);

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

    // Helper: Play notification sound if enabled
    const playNotificationSound = useCallback(() => {
        if (!settings?.notifSound) return;

        try {
            // Create a simple notification sound using Web Audio API
            const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // console.log('Could not play notification sound:', error);
        }
    }, [settings?.notifSound]);

    // Notifications: schedule reminders 10 minutes before each class
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
        // Store timeouts to clear on cleanup
        const timeouts: NodeJS.Timeout[] = [];
        if (Notification.permission === 'granted') {
            const now = new Date();
            classes.forEach(cls => {
                // Parse today's date for each class's next occurrence
                const weekdayMap: { [k in Class['day']]: number } = {
                    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5
                };
                const today = new Date();
                const classDay = weekdayMap[cls.day];
                let classDate = new Date(today);
                classDate.setDate(today.getDate() + ((7 + classDay - today.getDay()) % 7));
                // Set class start time
                const [h, m] = to24Hour(cls.startTime).split(":").map(Number);
                classDate.setHours(h, m, 0, 0);
                // If class is in the past for this week, skip
                if (classDate < now) return;
                // Schedule notification 10 minutes before
                const msUntil = classDate.getTime() - now.getTime() - 10 * 60 * 1000;
                if (msUntil > 0) {
                    const timeout = setTimeout(() => {
                        new Notification(`Upcoming: ${cls.courseName}`,
                            { body: `Room: ${cls.room}\nStarts at: ${cls.startTime}` });
                        playNotificationSound();
                    }, msUntil);
                    timeouts.push(timeout);
                }
            });
        }
        return () => { timeouts.forEach(clearTimeout); };
    }, [classes, playNotificationSound]);

    // Utility: Remove class
    const removeClass = async (id: string) => {
        try {
            const res = await deleteClassAPI(id);
            if (res.success) {
                setClasses(prev => prev.filter(cls => cls._id !== id));
                showAlert('Class deleted successfully!', 'success');
            } else {
                showAlert('Failed to delete class.', 'error');
            }
        } catch (err) {
            showAlert('Failed to delete class.', 'error');
        }
    };
    // Utility: Edit class
    const editClass = async (id: string, updatedClass: Class) => {
        const updated = await updateClassAPI(id, updatedClass);
        setClasses(prev => prev.map(cls => cls._id === id ? updated : cls));
    };

    // Today view state
    const [compact, setCompact] = useState(false);
    // Get today's weekday string
    useEffect(() => {
        setJsDay(new Date().getDay());
    }, [user_id]);
    const weekdayMap: { [k: number]: Class["day"] } = {
        1: "monday",
        2: "tuesday",
        3: "wednesday",
        4: "thursday",
        5: "friday"
    };
    const todayName = jsDay !== null ? weekdayMap[jsDay] : undefined;
    // Helper: get classes for today, sorted by start time
    const todayDateISO = (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    })();
    // Helper: check if a class is within semester dates
    function isWithinSemester(cls: Class) {
        if (!settings?.semesterStart || !settings?.semesterEnd) return true;
        // Use a different name for the reverse mapping
        const weekdayToNumMap: { [k in Class['day']]: number } = {
            monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5
        };
        const today = new Date();
        const classDay = weekdayToNumMap[cls.day];
        if (!classDay) return true;
        // Find the next date for this class's day
        const classDate = new Date(today);
        classDate.setDate(today.getDate() + ((7 + classDay - today.getDay()) % 7));
        classDate.setHours(0, 0, 0, 0);
        const semesterStart = new Date(settings.semesterStart);
        const semesterEnd = new Date(settings.semesterEnd);
        semesterStart.setHours(0, 0, 0, 0);
        semesterEnd.setHours(23, 59, 59, 999);
        return classDate >= semesterStart && classDate <= semesterEnd;
    }
    // Helper: check if a class is within semester dates for a given date
    function isWithinSemesterForDate(cls: Class, date: Date) {
        if (!settings?.semesterStart || !settings?.semesterEnd) return true;
        const semesterStart = new Date(settings.semesterStart);
        const semesterEnd = new Date(settings.semesterEnd);
        semesterStart.setHours(0, 0, 0, 0);
        semesterEnd.setHours(23, 59, 59, 999);
        return date >= semesterStart && date <= semesterEnd;
    }
    // In todayClasses and weekly calendar rendering, filter with isWithinSemester
    // For today view:
    const todayClasses = todayName
        ? classes
            .filter(cls => cls.day === todayName && isWithinSemester(cls))
            .sort((a, b) => {
                const [ah, am] = to24Hour(a.startTime).split(":").map(Number);
                const [bh, bm] = to24Hour(b.startTime).split(":").map(Number);
                return ah * 60 + am - (bh * 60 + bm);
            })
        : [];
    // Helper: is class in the past?
    function isPast(cls: Class) {
        if (typeof window === 'undefined') return false;
        const now = new Date();
        // Parse today's date with class end time
        const [h, m] = to24Hour(cls.endTime).split(":").map(Number);
        const classEnd = new Date();
        classEnd.setHours(h, m, 0, 0);
        return classEnd < now;
    }

    // Week navigation state
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

    // Helper: get week dates
    function getWeekDates(offset: number = 0) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (offset * 7)); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        return { startOfWeek, endOfWeek };
    }

    // Helper: format date range
    function formatDateRange(start: Date, end: Date) {
        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${startStr} - ${endStr}`;
    }

    // Week navigation handlers
    function goToPreviousWeek() {
        setCurrentWeekOffset(prev => prev - 1);
    }

    function goToNextWeek() {
        setCurrentWeekOffset(prev => prev + 1);
    }

    function goToCurrentWeek() {
        setCurrentWeekOffset(0);
    }

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
    // Helper: Add minutes to time string (24h)
    function addMinutes(time: string, mins: number) {
        if (!time) return "";
        let [h, m] = time.split(":").map(Number);
        if (isNaN(h) || isNaN(m) || isNaN(mins)) return "";
        let total = h * 60 + m + mins;
        let nh = Math.floor(total / 60) % 24;
        let nm = total % 60;
        return `${nh.toString().padStart(2, "0")}:${nm.toString().padStart(2, "0")}`;
    }
    // Helper: Check overlap (with optional ignoreId for editing)
    function isOverlap(newClass: Class, ignoreId?: string) {
        return classes.some((cls) => {
            if (ignoreId && cls._id === ignoreId) return false;
            if (cls.day !== newClass.day) return false;
            const s1 = to24Hour(cls.startTime);
            const e1 = to24Hour(cls.endTime);
            const s2 = to24Hour(newClass.startTime);
            const e2 = to24Hour(newClass.endTime);
            return (s1 < e2 && s2 < e1);
        });
    }
    // Get default durations from settings or fallback
    function getDefaultDuration(type: ClassType) {
        if (settings) {
            const val = type === "lab" ? settings.labDuration : settings.lectureDuration;
            return typeof val === "number" && !isNaN(val) ? val : (type === "lab" ? 120 : 60);
        }
        return type === "lab" ? 120 : 60;
    }
    // Handle form field change
    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        const update: Record<string, unknown> = { [name]: value };
        if (name === "type") {
            const duration = getDefaultDuration(value as ClassType);
            if (form.startTime && typeof duration === "number" && !isNaN(duration)) {
                const start24 = form.startTime;
                if (start24) {
                    const end = addMinutes(start24, duration);
                    update.endTime = end;
                }
            }
        }
        if (name === "startTime" && form.type) {
            const duration = getDefaultDuration(form.type as ClassType);
            if (typeof duration === "number" && !isNaN(duration)) {
                const start24 = value;
                if (start24) {
                    const end = addMinutes(start24, duration);
                    update.endTime = end;
                }
            }
        }
        setForm((prev) => ({ ...prev, ...update }));
    }
    // Handle submit
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.courseName || !form.day || !form.startTime || !form.type || !form.instructor || !form.room) {
            showAlert("Please fill all fields.", "warning");
            return;
        }
        if (!settings?.semesterStart || !settings?.semesterEnd) {
            showAlert("Please set your semester start and end dates in your profile before adding a class.", "warning");
            return;
        }
        const duration = getDefaultDuration(form.type as ClassType);
        if (typeof duration !== "number" || isNaN(duration)) {
            showAlert("Invalid class duration.", "warning");
            return;
        }
        const start24 = form.startTime!;
        const endTime = start24 ? addMinutes(start24, duration) : "";
        if (!endTime) {
            showAlert("Invalid start time.", "warning");
            return;
        }
        let overlap = false;
        if (form._id) {
            // Editing: do not check for overlap at all
            const updatedClass: Class & { color?: string } = {
                _id: form._id,
                user_id: user_id,
                course_id: form.course_id || "",
                courseName: form.courseName!,
                day: form.day as Class["day"],
                startTime: form.startTime!,
                endTime,
                type: form.type as ClassType,
                instructor: form.instructor!,
                room: form.room!,
                color: classTypeColor[form.type as ClassType],
            };
            editClass(form._id, updatedClass);
        } else {
            // Only create one class instance per add
            const newClass: Class & { color?: string } = {
                user_id: user_id,
                course_id: form.course_id || "",
                courseName: form.courseName!,
                day: form.day as Class["day"],
                startTime: form.startTime!,
                endTime,
                type: form.type as ClassType,
                instructor: form.instructor!,
                room: form.room!,
                color: classTypeColor[form.type as ClassType],
            };
            // Defensive check: skip if any required field is missing
            if (!newClass.user_id || !newClass.courseName || !newClass.day || !newClass.startTime || !newClass.endTime || !newClass.type || !newClass.instructor || !newClass.room) {
                console.warn('Skipping invalid class:', newClass);
                return;
            }
            setLoading(true);
            addClassAPI(newClass, semester_id)
                .then(added => {
                    setClasses(prev => [...prev, added]);
                    showAlert('Class added successfully!', 'success');
                })
                .catch(() => showAlert('Failed to add class.', 'error'))
                .finally(() => setLoading(false));
        }
        setShowModal(false);
        setForm({ courseName: "", day: "monday", startTime: "", type: "lecture", instructor: "", room: "" });
    }

    // Tab state: 'today' or 'week'
    const [tab, setTab] = useState<'today' | 'week'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('schedule-tab') as 'today' | 'week') || 'today';
        }
        return 'today';
    });
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('schedule-tab', tab);
        }
    }, [tab]);
    // For weekly view popup
    const [popupPos, setPopupPos] = useState<{ x: number, y: number } | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number, y: number } | null>(null);
    const [dragging, setDragging] = useState(false);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (dragging && dragOffset) {
            setPopupPos({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y,
            });
        }
    }, [dragging, dragOffset]);
    function handleMouseUp() {
        setDragging(false);
    }

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, dragOffset, handleMouseMove]);

    // Helper: open add modal prefilled
    function openAddModal(day: Class['day'], hour: number) {
        setForm({
            courseName: "",
            day,
            startTime: `${hour.toString().padStart(2, '0')}:00`, // 24-hour format for <input type='time'>
            type: "lecture",
            instructor: "",
            room: "",
        });
        setShowModal(true);
    }

    // Helper: open popup for class
    function openPopup(cls: Class, e: React.MouseEvent) {
        setPopupPos({ x: e.clientX + 10, y: e.clientY });
    }

    // Days and hours for grid
    const weekDays: Class['day'][] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8AM to 6PM

    // Color mapping for class types
    const classTypeColor: Record<ClassType, string> = {
        lecture: 'bg-blue-500',
        lab: 'bg-green-500',
    };

    // Helper: get classes in a given week
    function getClassesInWeek(weekOffset: number) {
        const { startOfWeek, endOfWeek } = getWeekDates(weekOffset);
        // For each class, check if its day falls within the week and is within semester
        return classes.filter(cls => {
            // Map class day to a date in the week
            const dayIndexMap = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
            const classDayIdx = dayIndexMap[cls.day];
            if (classDayIdx === undefined) return false;
            const classDate = new Date(startOfWeek);
            classDate.setDate(startOfWeek.getDate() + classDayIdx);
            return isWithinSemesterForDate(cls, classDate) && classDate >= startOfWeek && classDate <= endOfWeek;
        });
    }

    // Calculate daysToShow at the top level so it can be used in both Today and Weekly tabs
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysToShow = [] as { date: Date, dayName: string, scheduleDay: Class['day'], classes: Class[] }[];
    const currentDay = today.getDay();
    const isMonday = currentDay === 1;
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        if (isMonday && i === 7) continue;
        const dayOfWeek = date.getDay();
        const dayName = dayNames[dayOfWeek];
        const scheduleDay = weekdayMap[dayOfWeek];
        if (scheduleDay) {
            const dayClasses = classes
                .filter(cls => cls.day === scheduleDay && isWithinSemesterForDate(cls, date))
                .sort((a, b) => {
                    const [ah, am] = to24Hour(a.startTime).split(":").map(Number);
                    const [bh, bm] = to24Hour(b.startTime).split(":").map(Number);
                    return ah * 60 + am - (bh * 60 + bm);
                });
            if (dayClasses.length > 0) {
                daysToShow.push({ date, dayName, scheduleDay, classes: dayClasses });
            }
        }
    }

    if (!session || !session.user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl text-[var(--danger)] font-bold">Please log in to access your schedule.</div>
        </div>
      );
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;
    }
   

    return (
        <div className="max-w-4xl mx-auto p-2 sm:p-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-[var(--text)]">Schedule</h1>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mb-3 sm:mb-4">
                <div className="flex gap-2 order-1">
                    <button
                        onClick={() => setTab('today')}
                        className={`px-3 sm:px-4 py-2 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 cursor-pointer ${tab === 'today'
                            ? 'bg-[var(--primary)] text-[var(--btn-text)] shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--primary)]'
                            : 'bg-[var(--bg-light)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--border)]'
                            }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setTab('week')}
                        className={`px-3 sm:px-4 py-2 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 cursor-pointer ${tab === 'week'
                            ? 'bg-[var(--primary)] text-[var(--btn-text)] shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--primary)]'
                            : 'bg-[var(--bg-light)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--border)]'
                            }`}
                    >
                        Weekly
                    </button>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="order-2 sm:ml-auto px-3 sm:px-4 py-2 rounded-xl bg-[var(--btn-bg)] text-[var(--btn-text)] text-sm sm:text-base font-semibold cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 ring-2 ring-transparent focus:ring-[var(--primary)]"
                >
                    Add Class
                </button>
            </div>
            <div className="relative min-h-[80vh]">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg)]/60">
                        <LoadingSpinner />
                    </div>
                )}
                {tab === 'today' && (
                    <>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                            <span className="text-base sm:text-lg font-semibold text-[var(--text)]">This Week&apos;s Classes</span>
                            <button
                                onClick={() => setCompact(v => !v)}
                                className="px-3 sm:px-4 py-2 rounded-xl border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] bg-[var(--bg-light)] cursor-pointer hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 transition-all duration-200 shadow hover:shadow-lg"
                            >
                                {compact ? "Expanded" : "Compact"} View
                            </button>
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                            {(() => {
                                if (daysToShow.length === 0) {
                                    // Find the first week with classes in the semester
                                    let firstWeekWithClasses: { date: Date, dayName: string, scheduleDay: Class['day'], classes: Class[] }[] = [];
                                    if (settings?.semesterStart && settings?.semesterEnd) {
                                        const semesterStart = new Date(settings.semesterStart);
                                        const semesterEnd = new Date(settings.semesterEnd);
                                        let searchDate = new Date(semesterStart);
                                        for (let week = 0; week < 20; week++) { // search up to 20 weeks ahead
                                            let found = false;
                                            for (let i = 0; i < 7; i++) {
                                                const date = new Date(searchDate);
                                                date.setDate(searchDate.getDate() + i);
                                                const dayOfWeek = date.getDay();
                                                const dayName = dayNames[dayOfWeek];
                                                const scheduleDay = weekdayMap[dayOfWeek];
                                                if (scheduleDay) {
                                                    const dayClasses = classes
                                                        .filter(cls => cls.day === scheduleDay && isWithinSemesterForDate(cls, date))
                                                        .sort((a, b) => {
                                                            const [ah, am] = to24Hour(a.startTime).split(":").map(Number);
                                                            const [bh, bm] = to24Hour(b.startTime).split(":").map(Number);
                                                            return ah * 60 + am - (bh * 60 + bm);
                                                        });
                                                    if (dayClasses.length > 0) {
                                                        firstWeekWithClasses.push({ date, dayName, scheduleDay, classes: dayClasses });
                                                        found = true;
                                                    }
                                                }
                                            }
                                            if (found) break;
                                            searchDate.setDate(searchDate.getDate() + 7);
                                            if (searchDate > semesterEnd) break;
                                        }
                                    }
                                    if (firstWeekWithClasses.length > 0) {
                                        // Render the first week with classes in the same format as normal weeks
                                        return firstWeekWithClasses.map((dayData, dayIndex) => (
                                            <div key={dayIndex} className="bg-[var(--bg-light)] rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden">
                                                <div className="bg-[var(--primary)]/10 border-b border-[var(--border)] px-4 sm:px-6 py-3 sm:py-4">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                                                        <span className="font-bold text-base sm:text-lg text-[var(--text)]">
                                                            {dayData.dayName}
                                                        </span>
                                                        <span className="text-xs sm:text-sm text-[var(--text-muted)]">
                                                            {dayData.date.toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                                                    {dayData.classes.map((cls: Class, classIndex: number) => (
                                                        <div
                                                            key={cls._id}
                                                            className={
                                                                `rounded-xl p-3 sm:p-4 border border-[var(--border)] shadow-md flex flex-col bg-[var(--bg)] cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:border-[var(--primary)] transition-all duration-300 group animate-fadein` +
                                                                (isPast(cls) ? " opacity-50" : "")
                                                            }
                                                            style={{ animationDelay: `${(dayIndex * 0.1) + (classIndex * 0.05)}s` }}
                                                        >
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-3 gap-1 sm:gap-0">
                                                                <span className="font-bold text-base sm:text-lg text-[var(--text)] group-hover:text-[var(--primary)] transition-colors duration-300">
                                                                    {cls.courseName}
                                                                </span>
                                                                <span className="text-xs sm:text-sm text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors duration-300 font-medium">
                                                                    {cls.room}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 mb-2 sm:mb-3">
                                                                <span className="text-xs sm:text-sm text-[var(--text-muted)]">{cls.instructor}</span>
                                                                <span className="text-xs sm:text-sm text-[var(--text-muted)]">{cls.type}</span>
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                                                                <span className="text-xs sm:text-sm text-[var(--text-muted)]">{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                                                                <div className="flex gap-2 mt-2 sm:mt-0">
                                                                    <button
                                                                        className="px-3 py-1 rounded-lg bg-[var(--primary)] text-[var(--btn-text)] text-xs sm:text-sm font-semibold hover:bg-[var(--primary)]/90 transition-all duration-200 hover:scale-105 cursor-pointer"
                                                                        onClick={() => {
                                                                            setForm({ ...cls, _id: cls._id, originalId: cls._id });
                                                                            setShowModal(true);
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        className="px-3 py-1 rounded-lg bg-[var(--danger)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--danger)]/80 transition-all duration-200 hover:scale-105 cursor-pointer"
                                                                        onClick={() => {
                                                                            if (typeof cls._id === 'string') {
                                                                                showConfirm(
                                                                                    `Are you sure you want to delete "${cls.courseName}"?`,
                                                                                    () => removeClass(cls._id!),
                                                                                    {
                                                                                        title: "Delete Class",
                                                                                        confirmText: "Delete",
                                                                                        cancelText: "Cancel",
                                                                                        type: "danger"
                                                                                    }
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ));
                                    }
                                    // If no upcoming classes at all
                                    return (
                                        <div className="bg-[var(--bg-light)] rounded-2xl border border-[var(--border)] shadow-lg p-8 text-center mt-8">
                                            <div className="text-lg font-semibold text-[var(--text)] mb-2">No classes this week</div>
                                            <div className="text-base text-[var(--text-muted)]">No upcoming classes found in this semester.</div>
                                        </div>
                                    );
                                }
                                return daysToShow.map((dayData, dayIndex) => (
                                    <div key={dayIndex} className="bg-[var(--bg-light)] rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden">
                                        <div className="bg-[var(--primary)]/10 border-b border-[var(--border)] px-4 sm:px-6 py-3 sm:py-4">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                                                <span className="font-bold text-base sm:text-lg text-[var(--text)]">
                                                    {dayData.dayName}
                                                </span>
                                                <span className="text-xs sm:text-sm text-[var(--text-muted)]">
                                                    {dayData.date.toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                                            {dayData.classes.map((cls: Class, classIndex: number) => (
                                                <div
                                                    key={cls._id}
                                                    className={
                                                        `rounded-xl p-3 sm:p-4 border border-[var(--border)] shadow-md flex flex-col bg-[var(--bg)] cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:border-[var(--primary)] transition-all duration-300 group animate-fadein` +
                                                        (isPast(cls) ? " opacity-50" : "")
                                                    }
                                                    style={{ animationDelay: `${(dayIndex * 0.1) + (classIndex * 0.05)}s` }}
                                                >
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-3 gap-1 sm:gap-0">
                                                        <span className="font-bold text-base sm:text-lg text-[var(--text)] group-hover:text-[var(--primary)] transition-colors duration-300">
                                                            {cls.courseName}
                                                        </span>
                                                        <span className="text-xs sm:text-sm text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors duration-300 font-medium">
                                                            {cls.room}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 mb-2 sm:mb-3">
                                                        <span className="text-xs sm:text-sm text-[var(--text-muted)]">{cls.instructor}</span>
                                                        <span className="text-xs sm:text-sm text-[var(--text-muted)]">{cls.type}</span>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                                                        <span className="text-xs sm:text-sm text-[var(--text-muted)]">{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                                                        <div className="flex gap-2 mt-2 sm:mt-0">
                                                            <button
                                                                className="px-3 py-1 rounded-lg bg-[var(--primary)] text-[var(--btn-text)] text-xs sm:text-sm font-semibold hover:bg-[var(--primary)]/90 transition-all duration-200 hover:scale-105 cursor-pointer"
                                                                onClick={() => {
                                                                    setForm({ ...cls, _id: cls._id, originalId: cls._id });
                                                                    setShowModal(true);
                                                                }}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="px-3 py-1 rounded-lg bg-[var(--danger)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--danger)]/80 transition-all duration-200 hover:scale-105 cursor-pointer"
                                                                onClick={() => {
                                                                    if (typeof cls._id === 'string') {
                                                                        showConfirm(
                                                                            `Are you sure you want to delete "${cls.courseName}"?`,
                                                                            () => removeClass(cls._id!),
                                                                            {
                                                                                title: "Delete Class",
                                                                                confirmText: "Delete",
                                                                                cancelText: "Cancel",
                                                                                type: "danger"
                                                                            }
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </>
                )}
                {tab === 'week' && (
                    <div className="space-y-6">
                        {/* Week Navigation */}
                        <div className="flex items-center justify-between bg-[var(--bg-light)] rounded-xl p-4 border border-[var(--border)]">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={goToPreviousWeek}
                                    className="p-2 rounded-lg bg-[var(--btn-bg)] text-[var(--btn-text)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)] transition-all duration-200 cursor-pointer font-medium"
                                >
                                    ← Previous Week
                                </button>
                                <button
                                    onClick={goToNextWeek}
                                    className="p-2 rounded-lg bg-[var(--btn-bg)] text-[var(--btn-text)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)] transition-all duration-200 cursor-pointer font-medium"
                                >
                                    Next Week →
                                </button>
                                {currentWeekOffset !== 0 && (
                                    <button
                                        onClick={goToCurrentWeek}
                                        className="p-2 rounded-lg bg-[var(--primary)] text-[var(--btn-text)] hover:bg-[var(--primary)]/90 transition-all duration-200 cursor-pointer font-medium"
                                    >
                                        Today
                                    </button>
                                )}
                                {tab === 'week' && daysToShow.length === 0 && getClassesInWeek(currentWeekOffset).length === 0 && (
                                    <div>
                                        <button
                                            className="p-2 rounded-lg bg-[var(--primary)] text-[var(--btn-text)] hover:bg-[var(--primary)]/90 transition-all duration-200 cursor-pointer font-medium"
                                            onClick={() => {
                                            if (settings?.semesterStart && settings?.semesterEnd) {
                                                const semesterStart = new Date(settings.semesterStart);
                                                const semesterEnd = new Date(settings.semesterEnd);
                                                    let searchDate = new Date(semesterStart);
                                                    for (let week = 0; week < 20; week++) {
                                                        let found = false;
                                                    for (let i = 0; i < 7; i++) {
                                                        const date = new Date(searchDate);
                                                        date.setDate(searchDate.getDate() + i);
                                                            const weekdayMap: { [k: number]: Class["day"] } = {
                                                                1: "monday",
                                                                2: "tuesday",
                                                                3: "wednesday",
                                                                4: "thursday",
                                                                5: "friday"
                                                            };
                                                        const scheduleDay = weekdayMap[date.getDay()];
                                                        if (scheduleDay) {
                                                            const dayClasses = classes.filter(cls => cls.day === scheduleDay && isWithinSemesterForDate(cls, date));
                                                            if (dayClasses.length > 0) {
                                                                    // Calculate week offset based on start of week for both dates
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    const startOfThisWeek = new Date(today);
                                                                    startOfThisWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
                                                                    const startOfTargetWeek = new Date(date);
                                                                    startOfTargetWeek.setDate(date.getDate() - date.getDay() + 1); // Monday
                                                                    const weekOffset = Math.floor((startOfTargetWeek.getTime() - startOfThisWeek.getTime()) / (7 * 24 * 60 * 60 * 1000));
                                                                    setCurrentWeekOffset(weekOffset);
                                                                    found = true;
                                                                    break;
                                                            }
                                                        }
                                                    }
                                                        if (found) break;
                                                    searchDate.setDate(searchDate.getDate() + 7);
                                                    if (searchDate > semesterEnd) break;
                                                }
                                            }
                                            }}
                                        >
                                            Jump to Classes
                                        </button>
                                    </div>
                                )}

                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-[var(--text)]">
                                    {currentWeekOffset === 0 ? 'This Week' :
                                        currentWeekOffset > 0 ? `Week ${currentWeekOffset + 1}` :
                                            `Week ${currentWeekOffset}`}
                                </h3>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {(() => {
                                        const { startOfWeek, endOfWeek } = getWeekDates(currentWeekOffset);
                                        return formatDateRange(startOfWeek, endOfWeek);
                                    })()}
                                </p>
                            </div>
                        </div>

                        {/* Modern Calendar Grid */}
                        <div className="w-full overflow-x-auto sm:overflow-x-visible max-w-full">
                            <div className="min-w-[700px] bg-[var(--bg-light)] rounded-xl border border-[var(--border)] overflow-hidden shadow-lg">
                                {/* Calendar Header */}
                                <div className="grid grid-cols-8 bg-[var(--bg)] border-b border-[var(--border)]">
                                    <div className="p-4 border-r border-[var(--border)]">
                                        <div className="text-center">
                                            <div className="text-sm text-[var(--text-muted)]">Time</div>
                                        </div>
                                    </div>
                                    {['M', 'T', 'W', 'Th', 'F', 'S', 'Sun'].map((day, index) => (
                                        (() => {
                                            const { startOfWeek } = getWeekDates(currentWeekOffset);
                                            const dayDate = new Date(startOfWeek);
                                            dayDate.setDate(startOfWeek.getDate() + index);
                                            return (
                                                <div key={day} className="p-4 border-r border-[var(--border)] last:border-r-0">
                                                    <div className="text-center">
                                                        <div className="font-semibold text-[var(--text)]">{day}</div>
                                                        <div className="text-sm text-[var(--text-muted)]">
                                                            {dayDate.getDate()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ))}
                                </div>

                                {/* Calendar Body */}
                                <div className="grid grid-cols-8">
                                    {/* Time Column */}
                                    <div className="border-r border-[var(--border)]">
                                        {Array.from({ length: 11 }, (_, i) => i + 8).map(hour => (
                                            <div key={hour} className="h-20 border-b border-[var(--border)] flex items-center justify-center">
                                                <span className="text-xs text-[var(--text-muted)] font-medium">
                                                    {hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Day Columns */}
                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                        const { startOfWeek } = getWeekDates(currentWeekOffset);
                                        const dayDate = new Date(startOfWeek);
                                        dayDate.setDate(startOfWeek.getDate() + ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(day));
                                        return (
                                            <div key={day} className="relative border-r border-[var(--border)] last:border-r-0">
                                                {/* Hour Grid */}
                                                {Array.from({ length: 11 }, (_, i) => i + 8).map(hour => (
                                                    <div key={hour} className="h-20 border-b border-[var(--border)] relative hover:bg-[var(--bg)]/50 transition-colors duration-200 cursor-pointer group">
                                                        {/* Add class button on hover */}
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                            <button
                                                                onClick={() => openAddModal(day as Class['day'], hour)}
                                                                className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-bold hover:scale-110 transition-transform duration-200"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Classes for this day */}
                                                {classes.filter(cls => cls.day === day && isWithinSemesterForDate(cls, dayDate)).map((cls, idx) => {
                                                    const [sh, sm] = cls.startTime.split(":").map(Number);
                                                    const [eh, em] = cls.endTime.split(":").map(Number);

                                                    // Calculate position and height
                                                    const startMinutes = sh * 60 + sm;
                                                    const endMinutes = eh * 60 + em;
                                                    const gridStart = 8 * 60; // 8 AM
                                                    const gridEnd = 20 * 60; // 8 PM

                                                    // Only show classes within our grid
                                                    if (endMinutes <= gridStart || startMinutes >= gridEnd) return null;

                                                    const top = ((Math.max(startMinutes, gridStart) - gridStart) / 60) * 80; // 80px per hour
                                                    const height = Math.max(40, ((Math.min(endMinutes, gridEnd) - Math.max(startMinutes, gridStart)) / 60) * 80);

                                                    return (
                                                        <div
                                                            key={cls._id}
                                                            className="absolute left-1 right-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/90 text-white rounded-lg shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-[var(--border)] group z-10"
                                                            style={{
                                                                top: `${top}px`,
                                                                height: `${height}px`,
                                                                minHeight: '40px'
                                                            }}
                                                            onClick={e => openPopup(cls, e)}
                                                        >
                                                            {/* Main card content */}
                                                            <div className="p-2 h-full flex flex-col justify-center items-center">
                                                                <div className="font-semibold text-sm leading-tight">
                                                                    {cls.courseName}
                                                                </div>
                                                                <div className="text-xs opacity-90 mt-1">
                                                                    {formatTime(cls.startTime)}
                                                                </div>
                                                                <div className="text-xs opacity-80 mt-1">
                                                                    {cls.room}
                                                                </div>
                                                            </div>

                                                            {/* Hover overlay - appears outside card */}
                                                            <div className="absolute -top-8 left-0 p-1 right-0 bg-black text-white rounded-lg  opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                                                <div className="text-xs font-medium mb-1">
                                                                    {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setForm({ ...cls, _id: cls._id, originalId: cls._id });
                                                                            setShowModal(true);
                                                                        }}
                                                                        className="text-xs px-2 py-1 rounded hover:bg-white/20 transition-colors font-medium hover:cursor-pointer"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (typeof cls._id === 'string') {
                                                                                showConfirm(
                                                                                    `Are you sure you want to delete "${cls.courseName}"?`,
                                                                                    () => removeClass(cls._id!),
                                                                                    {
                                                                                        title: "Delete Class",
                                                                                        confirmText: "Delete",
                                                                                        cancelText: "Cancel",
                                                                                        type: "danger"
                                                                                    }
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="text-xs px-2 py-1 rounded hover:bg-red-500/30 transition-colors font-medium hover:cursor-pointer"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-[var(--bg-light)] rounded-xl p-4 border border-[var(--border)]">
                                <div className="text-sm text-[var(--text-muted)]">Total Classes</div>
                                <div className="text-2xl font-bold text-[var(--text)]">{classes.length}</div>
                            </div>
                            <div className="bg-[var(--bg-light)] rounded-xl p-4 border border-[var(--border)]">
                                <div className="text-sm text-[var(--text-muted)]">This Week</div>
                                <div className="text-2xl font-bold text-[var(--primary)]">
                                    {getClassesInWeek(0).length}
                                </div>
                            </div>
                            <div className="bg-[var(--bg-light)] rounded-xl p-4 border border-[var(--border)]">
                                <div className="text-sm text-[var(--text-muted)]">Classes in Selected Week</div>
                                <div className="text-2xl font-bold text-[var(--primary)]">
                                    {getClassesInWeek(currentWeekOffset).length}
                                </div>
                            </div>
                            <div className="bg-[var(--bg-light)] rounded-xl p-4 border border-[var(--border)]">
                                <div className="text-sm text-[var(--text-muted)]">Next Class</div>
                                <div className="text-lg font-semibold text-[var(--text)]">
                                    {(() => {
                                        const now = new Date();
                                        const today = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
                                        const todayClasses = classes.filter(cls => cls.day === today);
                                        if (todayClasses.length > 0) {
                                            const nextClass = todayClasses.find(cls => {
                                                const [h, m] = cls.startTime.split(":").map(Number);
                                                const classTime = new Date();
                                                classTime.setHours(h, m, 0, 0);
                                                return classTime > now;
                                            });
                                            return nextClass ? nextClass.courseName : 'No more classes today';
                                        }
                                        return 'No classes today';
                                    })()}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto h-screen bg-[var(--bg-dark)]/90 backdrop-blur-sm">
                        <div className="bg-[var(--bg-light)] rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 mt-8 max-h-[calc(100vh-48px)] overflow-y-auto border border-[var(--border)] scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                            <style>{` .scrollbar-none::-webkit-scrollbar { display: none; } `}</style>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-[var(--text)]">{form._id ? 'Edit Class' : 'Add Class'}</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-2xl text-[var(--text-muted)] hover:text-[var(--danger)] hover:scale-110 hover:-translate-y-1 focus:scale-110 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer"
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[var(--text)] font-semibold">Course Name</label>
                                    <input
                                        name="courseName"
                                        value={form.courseName || ""}
                                        onChange={handleChange}
                                        placeholder="Enter course name"
                                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[var(--text)] font-semibold">Day</label>
                                    <select
                                        name="day"
                                        value={form.day || "monday"}
                                        onChange={handleChange}
                                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                                        required
                                    >
                                        <option value="monday">Monday</option>
                                        <option value="tuesday">Tuesday</option>
                                        <option value="wednesday">Wednesday</option>
                                        <option value="thursday">Thursday</option>
                                        <option value="friday">Friday</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[var(--text)] font-semibold">Start Time</label>
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={form.startTime || ""}
                                        onChange={handleChange}
                                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[var(--text)] font-semibold">Type</label>
                                    <div className="flex items-center gap-2">
                                        <select
                                            name="type"
                                            value={form.type || "lecture"}
                                            onChange={handleChange}
                                            className="flex-1 p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                                            required
                                        >
                                            <option value="lecture">Lecture</option>
                                            <option value="lab">Lab</option>
                                        </select>
                                        <span
                                            ref={infoRef}
                                            className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors duration-200"
                                            title="Default durations: Lab = 2 hours, Lecture = 1 hour. You can change these in the Settings tab."
                                        >
                                            ℹ️
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[var(--text)] font-semibold">Instructor Name</label>
                                    <input
                                        name="instructor"
                                        value={form.instructor || ""}
                                        onChange={handleChange}
                                        placeholder="Enter instructor name"
                                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[var(--text)] font-semibold">Room Number</label>
                                    <input
                                        name="room"
                                        value={form.room || ""}
                                        onChange={handleChange}
                                        placeholder="Enter room number"
                                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[var(--text)] font-semibold">Course ID</label>
                                    <input
                                        name="course_id"
                                        value={form.course_id || ""}
                                        onChange={handleChange}
                                        placeholder="Enter course ID"
                                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                                        required
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-4 rounded-xl bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent focus:ring-[var(--primary)]"
                                    >
                                        {form._id ? 'Save Changes' : 'Add Class'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-4 rounded-xl border border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-light)] font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent focus:ring-[var(--border)]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: var(--overlay);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                }
                .modal {
                    background: var(--bg-light);
                    color: var(--text);
                    padding: 2rem; border-radius: 1rem; min-width: 320px;
                    box-shadow: var(--shadow-elevated);
                    border: 1px solid var(--border);
                }
                .modal label { display: block; margin: 12px 0 6px; color: var(--text); }
                .modal input, .modal select {
                    width: 100%; padding: 6px 8px; margin-top: 2px; border-radius: 4px;
                    border: 1px solid var(--input-border);
                    background: var(--input-bg);
                    color: var(--text);
                }
                .modal input::placeholder {
                    color: var(--input-placeholder);
                }
                .btn-primary {
                    padding: 6px 16px; border-radius: 4px; border: none;
                    background: var(--btn-bg); color: var(--btn-text); cursor: pointer;
                    transition: background 0.2s;
                }
                .btn-primary:hover {
                    background: var(--btn-hover-bg); color: var(--btn-hover-text);
                }
                .btn-secondary {
                    padding: 6px 16px; border-radius: 4px; border: none;
                    background: var(--border-muted); color: var(--text-muted); cursor: pointer;
                }
                .modal button + button { margin-left: 8px; }
            `}</style>
                <AlertComponent />
                <ConfirmComponent />
            </div>
        </div>
    );
}
