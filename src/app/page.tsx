"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaCalendarCheck, FaTasks, FaRobot, FaChartBar, FaMobileAlt, FaChalkboardTeacher, FaUserShield, FaPalette, FaBolt, FaUserCircle, FaSignInAlt, FaListAlt, FaHistory } from "react-icons/fa";
import { FaLinkedin, FaInstagram, FaGithub, FaGlobe, FaEnvelope } from "react-icons/fa";

const features = [
  { icon: "📊", title: "Attendance Tracking" },
  { icon: "📅", title: "Class Scheduling" },
  { icon: "📝", title: "Smart Task Manager" },
  { icon: "🚀", title: "Reminders & Notifications" },
];

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    } else {
      alert('To install the app, use your browser menu and select "Add to Home Screen".');
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col bg-[var(--bg)]">
      {/* Hero Section - Dribbble Inspired */}
      <section className="relative w-full flex flex-col items-center justify-center py-20 overflow-hidden">

        <div className="flex flex-col items-center z-10 max-w-xl w-full text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-[var(--primary)] mb-6 leading-tight drop-shadow-lg">EduTracker<br /><span className="text-[var(--text)] font-bold">Modern Student Productivity</span></h1>
          <p className="text-xl text-[var(--text-muted)] mb-8 max-w-lg mx-auto">Track your classes, attendance, and tasks with a beautiful, responsive interface. Stay organized, boost your grades, and never miss a class or deadline again!</p>
          <button
            onClick={handleInstallClick}
            className="px-10 py-4 rounded-2xl bg-[var(--primary)] text-[var(--btn-text)] font-bold text-2xl shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 mb-6 cursor-pointer ring-2 ring-transparent focus:ring-[var(--primary)]"
          >
            Download App
          </button>
          <div className="flex gap-6 mt-2 justify-center">
            <a href="https://www.linkedin.com/in/dahiyaprtk27" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
              <FaLinkedin className="text-3xl sm:text-4xl text-[#0A66C2] hover:text-[var(--primary)] transition-colors duration-200 cursor-pointer" />
            </a>
            <a href="https://dahiya-prtk.web.app/" aria-label="Portfolio" target="_blank" rel="noopener noreferrer">
              <FaGlobe className="text-3xl sm:text-4xl text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors duration-200 cursor-pointer" />
            </a>
            <a href="https://www.instagram.com/dahiya_prtk27/" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <FaInstagram className="text-3xl sm:text-4xl text-[#E4405F] hover:text-[var(--primary)] transition-colors duration-200 cursor-pointer" />
            </a>
            <a href="https://github.com/PrateekDahiya" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
              <FaGithub className="text-3xl sm:text-4xl text-[var(--text)] hover:text-[var(--primary)] transition-colors duration-200 cursor-pointer" />
            </a>
            <a href="mailto:dahiyaprateek27@gmail.com" aria-label="Gmail" target="_blank" rel="noopener noreferrer">
              <FaEnvelope className="text-3xl sm:text-4xl text-[#EA4335] hover:text-[var(--primary)] transition-colors duration-200 cursor-pointer" />
            </a>
          </div>
        </div>
      </section>


      {/* Features Section - Modern Grid with Accent Backgrounds */}
      <section className="w-full py-20 flex flex-col items-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-[var(--primary)] mb-12 text-center">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl w-full">
          <div className="flex flex-col items-center rounded-3xl shadow-xl p-10 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--bg-light)] border border-[var(--primary)]/20 hover:scale-105 hover:shadow-2xl transition-all duration-200 animate-fade-in">
            <FaCalendarCheck className="text-5xl text-[var(--primary)] mb-4" />
            <h3 className="text-xl font-bold mb-2 text-[var(--primary)]">Schedule & Attendance</h3>
            <p className="text-[var(--text-muted)] text-center">Track your classes, mark attendance, and view weekly or daily schedules. Get smart suggestions to stay above the required percentage.</p>
          </div>
          <div className="flex flex-col items-center rounded-3xl shadow-xl p-10 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--bg-light)] border border-[var(--primary)]/20 hover:scale-105 hover:shadow-2xl transition-all duration-200 animate-fade-in">
            <FaTasks className="text-5xl text-[var(--primary)] mb-4" />
            <h3 className="text-xl font-bold mb-2 text-[var(--primary)]">To-Do List</h3>
            <p className="text-[var(--text-muted)] text-center">Organize tasks by course, set priorities, and mark completion. Stay on top of assignments and deadlines.</p>
          </div>
          <div className="flex flex-col items-center rounded-3xl shadow-xl p-10 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--bg-light)] border border-[var(--primary)]/20 hover:scale-105 hover:shadow-2xl transition-all duration-200 animate-fade-in">
            <FaChartBar className="text-5xl text-[var(--primary)] mb-4" />
            <h3 className="text-xl font-bold mb-2 text-[var(--primary)]">Dashboard & Activity</h3>
            <p className="text-[var(--text-muted)] text-center">See stats, upcoming classes/tasks, and a timeline of your activity. Visualize your academic progress at a glance.</p>
          </div>
          <div className="flex flex-col items-center rounded-3xl shadow-xl p-10 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--bg-light)] border border-[var(--primary)]/20 hover:scale-105 hover:shadow-2xl transition-all duration-200 animate-fade-in">
            <FaUserShield className="text-5xl text-[var(--primary)] mb-4" />
            <h3 className="text-xl font-bold mb-2 text-[var(--primary)]">Secure Authentication</h3>
            <p className="text-[var(--text-muted)] text-center">Sign up/sign in securely with credentials or Google. Your data is always protected.</p>
          </div>
          <div className="flex flex-col items-center rounded-3xl shadow-xl p-10 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--bg-light)] border border-[var(--primary)]/20 hover:scale-105 hover:shadow-2xl transition-all duration-200 animate-fade-in">
            <FaBolt className="text-5xl text-[var(--primary)] mb-4" />
            <h3 className="text-xl font-bold mb-2 text-[var(--primary)]">Fast & Modern</h3>
            <p className="text-[var(--text-muted)] text-center">Built with Next.js App Router, Tailwind CSS, and best practices for performance and accessibility.</p>
          </div>
          <div className="flex flex-col items-center rounded-3xl shadow-xl p-10 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--bg-light)] border border-[var(--primary)]/20 hover:scale-105 hover:shadow-2xl transition-all duration-200 animate-fade-in">
            <FaMobileAlt className="text-5xl text-[var(--primary)] mb-4" />
            <h3 className="text-xl font-bold mb-2 text-[var(--primary)]">Fully Responsive & PWA</h3>
            <p className="text-[var(--text-muted)] text-center">Works seamlessly on all devices. Install as a PWA on Android, iPhone, or desktop. Access your data anywhere—even offline!</p>
          </div>
          <div className="flex flex-col items-center rounded-3xl shadow-xl p-10 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--bg-light)] border border-[var(--primary)]/20 hover:scale-105 hover:shadow-2xl transition-all duration-200 animate-fade-in">
            <FaPalette className="text-5xl text-[var(--primary)] mb-4" />
            <h3 className="text-xl font-bold mb-2 text-[var(--primary)]">Theme Support</h3>
            <p className="text-[var(--text-muted)] text-center">Switch between light and dark themes. All UI elements use CSS variables for consistent theming.</p>
          </div>
        </div>
      </section>

      {/* How It Works / Tabs Overview Section - Zig-Zag Layout */}
      <section className="w-full py-20 flex flex-col items-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-[var(--primary)] mb-16 text-center">How It Works</h2>
        <div className="w-full max-w-5xl flex flex-col gap-20">
          {/* Dashboard Step */}
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
            <div className="flex-1 flex flex-col items-end md:items-end">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--btn-text)] text-3xl shadow-lg mb-4"><FaChartBar /></div>
              <h3 className="text-2xl font-bold text-[var(--primary)] mb-2 text-right">Dashboard</h3>
              <p className="text-[var(--text-muted)] text-right max-w-xs">Overview of your academic progress, quick stats, and recent activity timeline.</p>
            </div>
            <div className="flex-1 flex justify-center md:justify-start">
              <img src="/screenshots/dashboard.png" alt="Dashboard Screenshot" className="w-full max-w-md rounded-2xl shadow-xl border border-[var(--border)] bg-[var(--bg-light)] object-cover" />
            </div>
          </div>
          {/* Attendance Step */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-20">
            <div className="flex-1 flex flex-col items-start">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--btn-text)] text-3xl shadow-lg mb-4"><FaCalendarCheck /></div>
              <h3 className="text-2xl font-bold text-[var(--primary)] mb-2 text-left">Attendance</h3>
              <p className="text-[var(--text-muted)] text-left max-w-xs">Mark, view, and analyze your attendance for every course. Get actionable suggestions.</p>
            </div>
            <div className="flex-1 flex justify-center md:justify-end">
              <img src="/screenshots/attendance.png" alt="Attendance Screenshot" className="w-full max-w-md rounded-2xl shadow-xl border border-[var(--border)] bg-[var(--bg-light)] object-cover" />
            </div>
          </div>
          {/* Schedule Step */}
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
            <div className="flex-1 flex flex-col items-end md:items-end">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--btn-text)] text-3xl shadow-lg mb-4"><FaChalkboardTeacher /></div>
              <h3 className="text-2xl font-bold text-[var(--primary)] mb-2 text-right">Schedule</h3>
              <p className="text-[var(--text-muted)] text-right max-w-xs">Visualize your weekly class schedule, add or edit classes, and view class details.</p>
            </div>
            <div className="flex-1 flex justify-center md:justify-start">
              <img src="/screenshots/schedule.png" alt="Schedule Screenshot" className="w-full max-w-md rounded-2xl shadow-xl border border-[var(--border)] bg-[var(--bg-light)] object-cover" />
            </div>
          </div>
          {/* ToDo Step */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-20">
            <div className="flex-1 flex flex-col items-start">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--btn-text)] text-3xl shadow-lg mb-4"><FaListAlt /></div>
              <h3 className="text-2xl font-bold text-[var(--primary)] mb-2 text-left">ToDo</h3>
              <p className="text-[var(--text-muted)] text-left max-w-xs">Manage your tasks and assignments. Add, edit, or mark tasks as complete.</p>
            </div>
            <div className="flex-1 flex justify-center md:justify-end">
              <img src="/screenshots/todo.png" alt="ToDo Screenshot" className="w-full max-w-md rounded-2xl shadow-xl border border-[var(--border)] bg-[var(--bg-light)] object-cover" />
            </div>
          </div>
          {/* Activity Step */}
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
            <div className="flex-1 flex flex-col items-end md:items-end">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--btn-text)] text-3xl shadow-lg mb-4"><FaHistory /></div>
              <h3 className="text-2xl font-bold text-[var(--primary)] mb-2 text-right">Activity</h3>
              <p className="text-[var(--text-muted)] text-right max-w-xs">See a timeline of your recent actions and updates in the app.</p>
            </div>
            <div className="flex-1 flex justify-center md:justify-start">
              <img src="/screenshots/activity.png" alt="Activity Screenshot" className="w-full max-w-md rounded-2xl shadow-xl border border-[var(--border)] bg-[var(--bg-light)] object-cover" />
            </div>
          </div>
          {/* Profile Step */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-20">
            <div className="flex-1 flex flex-col items-start">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--btn-text)] text-3xl shadow-lg mb-4"><FaUserCircle /></div>
              <h3 className="text-2xl font-bold text-[var(--primary)] mb-2 text-left">Profile</h3>
              <p className="text-[var(--text-muted)] text-left max-w-xs">View and edit your personal information and avatar.</p>
            </div>
            <div className="flex-1 flex justify-center md:justify-end">
              <img src="/screenshots/profile.png" alt="Profile Screenshot" className="w-full max-w-md rounded-2xl shadow-xl border border-[var(--border)] bg-[var(--bg-light)] object-cover" />
            </div>
          </div>

        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-16 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-[var(--primary)] mb-4 text-center">Ready to get started?</h2>
        <p className="text-lg text-[var(--text-muted)] mb-8 text-center max-w-xl">Sign up now and take control of your academic journey with EduTracker. Stay organized, motivated, and ahead of your schedule!</p>
        <button
          onClick={handleInstallClick}
          className="px-8 py-4 rounded-xl bg-[var(--primary)] text-[var(--btn-text)] font-bold text-xl shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 mb-4 cursor-pointer ring-2 ring-transparent focus:ring-[var(--primary)]"
        >
          Download EduTracker
        </button>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 flex flex-col items-center">
        <span className="text-base text-[var(--text-muted)] mb-4">Created by <span className="font-bold text-[var(--primary)]">Prateek Dahiya</span></span>
        <div className="flex flex-wrap gap-6 justify-center">
          <a href="https://www.linkedin.com/in/dahiyaprtk27" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
            <FaLinkedin className="text-3xl sm:text-4xl text-[#0A66C2] hover:text-[var(--primary)] transition-colors duration-200 cursor-pointer" />
          </a>
          <a href="https://dahiya-prtk.web.app/" aria-label="Portfolio" target="_blank" rel="noopener noreferrer">
            <FaGlobe className="text-3xl sm:text-4xl text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors duration-200 cursor-pointer" />
          </a>
          <a href="https://www.instagram.com/dahiya_prtk27/" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
            <FaInstagram className="text-3xl sm:text-4xl text-[#E4405F] hover:text-[var(--primary)] transition-colors duration-200 cursor-pointer" />
          </a>
          <a href="https://github.com/PrateekDahiya" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
            <FaGithub className="text-3xl sm:text-4xl text-[var(--text)] hover:text-[var(--primary)] transition-colors duration-200 cursor-pointer" />
          </a>
          <a href="mailto:dahiyaprateek27@gmail.com" aria-label="Gmail" target="_blank" rel="noopener noreferrer">
            <FaEnvelope className="text-3xl sm:text-4xl text-[#EA4335] hover:text-[var(--primary)] transition-colors duration-200 cursor-pointer" />
          </a>
        </div>
      </footer>
    </main>
  );
}
