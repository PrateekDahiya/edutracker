"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { getCourses } from "../../services/attendanceService";
import { getTasks } from "../../services/todoService";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAlert } from "../components/AlertPopup";
import Image from "next/image";
import { useSettings } from "../components/SettingsProvider";

export default function Profile() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [photo, setPhoto] = useState("");
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [overallAttendance, setOverallAttendance] = useState<number>(0);
  const [tasksCompleted, setTasksCompleted] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { showAlert, AlertComponent } = useAlert();
  const { settings, setSettings, refreshSettings } = useSettings();
  const [semesterStart, setSemesterStart] = useState(settings?.semesterStart || "");
  const [semesterEnd, setSemesterEnd] = useState(settings?.semesterEnd || "");

  const USER_CACHE_KEY = "edutracker_user_profile";
  const USER_STATS_CACHE_KEY = "edutracker_user_stats";

  useEffect(() => {
    setMounted(true);
    if (session?.user?.email) {
      setLoading(true);
      // Load profile from localStorage first
      const cachedProfile = localStorage.getItem(USER_CACHE_KEY);
      if (cachedProfile) {
        const user = JSON.parse(cachedProfile);
        setName(user.name || "");
        setEmail(user.email || "");
        setCollege(user.college || "");
        setPhoto(user.image || "");
      }
      // Load stats from localStorage first
      const cachedStats = localStorage.getItem(USER_STATS_CACHE_KEY);
      if (cachedStats) {
        const stats = JSON.parse(cachedStats);
        setTotalCourses(stats.totalCourses || 0);
        setOverallAttendance(stats.overallAttendance || 0);
        setTasksCompleted(stats.tasksCompleted || 0);
      }
      if (settings) {
        setSemesterStart(settings.semesterStart || "");
        setSemesterEnd(settings.semesterEnd || "");
      }
      // Always fetch from DB in background to update cache
      fetch(`/api/user?email=${encodeURIComponent(session.user.email)}`)
        .then(res => res.json())
        .then(user => {
          if (user) {
            setName(user.name || (user.email ? user.email.split('@')[0] : ""));
            setEmail(user.email || "");
            setCollege(user.college || "");
            setPhoto(user.image || "");
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
          }
        });
      const user_id = session?.user?.email ? session.user.email.split('@')[0] : '';
      const semester_id = settings?.semesterStart && settings?.semesterEnd ? `${settings.semesterStart}_${settings.semesterEnd}` : "";
      getCourses(user_id, semester_id).then(courses => {
        setTotalCourses(courses.length);
        let attended = 0;
        let total = 0;
        courses.forEach(c => {
          attended += c.at_class;
          total += c.t_class;
        });
        const attendance = total > 0 ? Math.round((attended / total) * 100) : 0;
        setOverallAttendance(attendance);
        // Save stats to localStorage (partial, will update tasks next)
        localStorage.setItem(USER_STATS_CACHE_KEY, JSON.stringify({
          totalCourses: courses.length,
          overallAttendance: attendance,
          tasksCompleted // will update after getTasks
        }));
      });
      getTasks(user_id, semester_id).then(tasks => {
        const completed = tasks.filter(t => t.completed).length;
        setTasksCompleted(completed);
        // Update stats in localStorage
        const prevStats = JSON.parse(localStorage.getItem(USER_STATS_CACHE_KEY) || '{}');
        localStorage.setItem(USER_STATS_CACHE_KEY, JSON.stringify({
          ...prevStats,
          tasksCompleted: completed
        }));
      }).finally(() => setLoading(false));
    }
  }, [session, tasksCompleted, settings]);

  // On profile save, update localStorage and DB
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const user = { email, name, college, image: photo };
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      // Save semester dates to settings
      await fetch("/api/setting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: email,
          semesterStart,
          semesterEnd,
        }),
      });
      await refreshSettings();
      window.location.reload(); // Refresh session and header image
      showAlert("Profile saved successfully!", "success");
    } catch {
      showAlert("Error saving profile", "error");
    } finally {
      setLoading(false);
    }
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleClear() {
    setName("");
    setCollege("");
    setPhoto("");
    // Optionally, clear from DB as well
  }

  if (session === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  if (!session) return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4 text-center">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-[var(--text)]">Profile</h1>
      <button
        onClick={() => signIn()}
        className="px-4 sm:px-6 py-3 rounded-lg bg-[var(--primary)] text-[var(--btn-text)] font-semibold shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent focus:ring-[var(--primary)]"
      >
        Sign In
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg)]/60 rounded-xl">
            <LoadingSpinner />
          </div>
        )}

        <form onSubmit={handleSave} className={`bg-[var(--bg-light)] rounded-2xl shadow-xl border border-[var(--border)] p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6 md:gap-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Profile Photo Section */}
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <div className="relative group">
              <Image
                src={session?.user?.image || "/profile-placeholder.png"}
                alt="avatar"
                width={40}
                height={40}
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-[var(--primary)] object-cover shadow-xl mb-4"
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="absolute -bottom-1 -right-1 sm:bottom-2 sm:right-2 bg-[var(--primary)] text-[var(--btn-text)] rounded-full p-2 sm:p-3 shadow-lg hover:shadow-xl hover:scale-110 hover:-translate-y-1 focus:scale-110 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent focus:ring-[var(--primary)] group-hover:animate-bounce"
              >
                <span className="text-sm sm:text-xl">✏️</span>
              </button>
              <input type="file" accept="image/*" ref={fileInput} onChange={handlePhoto} className="hidden" />
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex flex-col gap-2 sm:gap-3 group">
              <label className="text-[var(--text)] font-semibold text-sm sm:text-base group-hover:text-[var(--primary)] transition-colors duration-200">Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 group">
              <label className="text-[var(--text)] font-semibold text-sm sm:text-base group-hover:text-[var(--primary)] transition-colors duration-200">Email</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 group md:col-span-2">
              <label className="text-[var(--text)] font-semibold text-sm sm:text-base group-hover:text-[var(--primary)] transition-colors duration-200">College</label>
              <input
                value={college}
                onChange={e => setCollege(e.target.value)}
                className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-2 sm:gap-3 group">
              <label className="text-[var(--text)] font-semibold text-sm sm:text-base group-hover:text-[var(--primary)] transition-colors duration-200">Semester Start</label>
              <input
                type="date"
                value={semesterStart}
                onChange={e => setSemesterStart(e.target.value)}
                className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                required
              />
            </div>
            <div className="flex flex-col gap-2 sm:gap-3 group">
              <label className="text-[var(--text)] font-semibold text-sm sm:text-base group-hover:text-[var(--primary)] transition-colors duration-200">Semester End</label>
              <input
                type="date"
                value={semesterEnd}
                onChange={e => setSemesterEnd(e.target.value)}
                className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mt-4 sm:mt-8">
            <div className="flex flex-col items-center p-3 sm:p-6 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group animate-fadein" style={{ animationDelay: '0.1s' }}>
              <span className="text-2xl sm:text-3xl font-bold text-[var(--primary)] group-hover:scale-125 transition-transform duration-300">{totalCourses}</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] font-medium group-hover:text-[var(--primary)] transition-colors duration-200 text-center">Total Courses</span>
            </div>

            <div className="flex flex-col items-center p-3 sm:p-6 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group animate-fadein" style={{ animationDelay: '0.2s' }}>
              <span className="text-2xl sm:text-3xl font-bold text-[var(--success)] group-hover:scale-125 transition-transform duration-300">{overallAttendance}%</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] font-medium group-hover:text-[var(--success)] transition-colors duration-200 text-center">Overall Attendance</span>
            </div>

            <div className="flex flex-col items-center p-3 sm:p-6 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group animate-fadein" style={{ animationDelay: '0.3s' }}>
              <span className="text-2xl sm:text-3xl font-bold text-[var(--primary)] group-hover:scale-125 transition-transform duration-300">{tasksCompleted}</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] font-medium group-hover:text-[var(--primary)] transition-colors duration-200 text-center">Tasks Completed</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-8">
            <button
              type="submit"
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent focus:ring-[var(--primary)]"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-[var(--danger)] text-white font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent focus:ring-[var(--danger)]"
            >
              Clear Profile
            </button>
          </div>
        </form>
      </div>

      <AlertComponent />
    </div>
  );
}
