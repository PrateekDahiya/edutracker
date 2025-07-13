"use client";
import { useState } from "react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import LoadingSpinner from "../components/LoadingSpinner";

const filters = [
  { label: "All", value: "all" },
  { label: "Attendance", value: "attendance" },
  { label: "Tasks", value: "task" },
];

export default function Activity() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState("all");
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) return;
    setLoading(true);
    fetch(`/api/activity?user_id=${encodeURIComponent(session.user.email)}&type=${filter}`)
      .then(res => res.json())
      .then(setActivities)
      .finally(() => setLoading(false));
  }, [filter, session]);

  const filtered = activities;

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-[var(--text)]">Activity</h1>
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6 xs:flex-col xs:gap-1 xs:w-full">
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 cursor-pointer w-full xs:w-full sm:w-auto text-sm sm:text-base ${filter===f.value ? 'bg-[var(--primary)] text-[var(--btn-text)] shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--primary)]' : 'bg-[var(--bg-light)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--border)]'}`}>{f.label}</button>
        ))}
      </div>
      <div className="relative min-h-[60vh]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg)]/60">
            <LoadingSpinner />
          </div>
        )}
        {!loading && activities.length === 0 && (
          <div className="text-center text-[var(--text-muted)] py-8 text-base sm:text-lg">No activity found.</div>
        )}
        {!loading && filtered.map((a, i) => (
          <div key={a._id || i} className="flex flex-col xs:flex-col sm:flex-row items-start gap-2 sm:gap-4 bg-[var(--bg-light)] rounded-xl p-3 sm:p-4 shadow group hover:scale-105 hover:shadow-2xl transition cursor-pointer mb-3 sm:mb-4">
            <div className="flex flex-row sm:flex-col items-center sm:items-center">
              <div className={`w-3 h-3 rounded-full ${a.type==='attendance' ? (a.status==='yes' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]') : 'bg-[var(--primary)]'}`}></div>
              {i < filtered.length-1 && <div className="h-px sm:w-px sm:flex-1 bg-[var(--border-muted)] my-1 sm:my-1" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors duration-300 text-sm sm:text-base">{a.label}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{a.time ? new Date(a.time).toLocaleString() : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
