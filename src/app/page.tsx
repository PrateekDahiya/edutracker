"use client";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const features = [
  { icon: "📊", title: "Attendance Tracking" },
  { icon: "📅", title: "Class Scheduling" },
  { icon: "📝", title: "Smart Task Manager" },
  { icon: "🚀", title: "Reminders & Notifications" },
];

export default function Landing() {
  const [currentYear, setCurrentYear] = useState(1970);
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="min-h-screen flex flex-col text-[var(--text)] transition-colors duration-300">
      <main className={`flex-1 flex flex-col items-center justify-center px-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-center mb-4 mt-12">Stay Ahead in College — Smarter, Not Harder</h1>
        <p className="text-lg sm:text-2xl text-center mb-8 text-[var(--text-muted)] max-w-2xl">Manage classes, attendance, tasks, and more — all in one place</p>
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <Link
            href={session ? "/dashboard" : "/auth/signup"}
            className="px-6 py-3 rounded-lg bg-[var(--primary)] text-[var(--btn-text)] text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent focus:ring-[var(--primary)]"
          >
            Get Started
          </Link>
        </div>
        <section className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-16 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="flex flex-col items-center bg-[var(--bg-light)] rounded-xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <span className="text-4xl mb-2 group-hover:animate-bounce group-hover:scale-125 transition-transform duration-200">{f.icon}</span>
              <span className="text-lg font-semibold text-center group-hover:text-[var(--primary)] transition-colors duration-200">{f.title}</span>
            </div>
          ))}
        </section>
      </main>
      
    </div>
  );
}
