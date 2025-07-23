"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [appInfo] = useState({
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    env: process.env.NODE_ENV,
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || !(session.user as any).isAdmin) {
      router.replace("/dashboard");
      return;
    }
    fetch("/api/user?all=1")
      .then((res) => res.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [session, status, router]);
  if (loading) return <div className="p-8 text-center">Loading admin analytics...</div>;
  if (!stats) return <div className="p-8 text-center text-red-500">Failed to load admin data.</div>;

  // Edit user handler
  const handleEdit = async (user: any) => {
    setEditUser(user);
  };
  const handleEditSave = async () => {
    setSaving(true);
    const res = await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUser),
    });
    setSaving(false);
    setEditUser(null);
    if (res.ok) {
      // Refresh stats
      fetch("/api/user?all=1").then((r) => r.json()).then(setStats);
    }
  };
  // Delete user handler
  const handleDelete = async () => {
    setSaving(true);
    const res = await fetch("/api/user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: deleteUser.user_id }),
    });
    setSaving(false);
    setDeleteUser(null);
    if (res.ok) {
      // Refresh stats
      fetch("/api/user?all=1").then((r) => r.json()).then(setStats);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text)]">Admin Analytics</h1>
        <span className="text-xs sm:text-sm text-[var(--text-muted)]">All user and app statistics</span>
      </div>
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Total Users" value={stats.totalUsers} color="text-[var(--primary)]" i={0} />
        <StatCard label="Total Tasks" value={stats.totalTasks} color="text-[var(--primary)]" i={1} />
        <StatCard label="Total Attendance" value={stats.totalAttendance} color="text-[var(--primary)]" i={2} />
        <StatCard label="Total Classes" value={stats.totalClasses} color="text-[var(--primary)]" i={3} />
      </div>
      <h2 className="text-lg sm:text-xl font-semibold mb-2 text-[var(--text)]">All Users</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm bg-[var(--bg-light)] rounded-xl shadow">
          <thead>
            <tr className="bg-[var(--bg)]">
              <th className="p-2 border text-left">Name</th>
              <th className="p-2 border text-left">Email</th>
              <th className="p-2 border text-center">Tasks</th>
              <th className="p-2 border text-center">Attendance</th>
              <th className="p-2 border text-center">Classes</th>
              <th className="p-2 border text-center">Admin</th>
              <th className="p-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stats.users.map((u: any, idx: number) => (
              <tr key={u._id} className={"even:bg-[var(--bg)] hover:bg-[var(--bg-light)] transition-colors duration-200"}>
                <td className="p-2 border text-[var(--text)]">{u.name || "-"}</td>
                <td className="p-2 border text-[var(--text)]">{u.email}</td>
                <td className="p-2 border text-center font-bold text-[var(--primary)]">{u.taskCount}</td>
                <td className="p-2 border text-center font-bold text-[var(--primary)]">{u.attendanceCount}</td>
                <td className="p-2 border text-center font-bold text-[var(--primary)]">{u.classCount}</td>
                <td className="p-2 border text-center">{u.isAdmin ? <span className="text-[var(--success)] font-bold">✔️</span> : ""}</td>
                <td className="p-2 border text-center flex gap-2 justify-center">
                  <button className="px-2 py-1 rounded bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary)]/90 transition" onClick={() => handleEdit(u)}>Edit</button>
                  <button className="px-2 py-1 rounded bg-[var(--danger)] text-white text-xs font-semibold hover:bg-[var(--danger)]/90 transition" onClick={() => setDeleteUser(u)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--bg-light)] rounded-xl p-6 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit User</h3>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col text-sm font-semibold">
                Name
                <input className="mt-1 p-2 rounded border" value={editUser.name || ""} onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
              </label>
              <label className="flex flex-col text-sm font-semibold">
                Email
                <input className="mt-1 p-2 rounded border" value={editUser.email || ""} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
              </label>
              <label className="flex flex-col text-sm font-semibold">
                College
                <input className="mt-1 p-2 rounded border" value={editUser.college || ""} onChange={e => setEditUser({ ...editUser, college: e.target.value })} />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={!!editUser.isAdmin} onChange={e => setEditUser({ ...editUser, isAdmin: e.target.checked })} />
                Admin
              </label>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button className="px-3 py-1 rounded bg-[var(--danger)] text-white font-semibold" onClick={() => setEditUser(null)} disabled={saving}>Cancel</button>
              <button className="px-3 py-1 rounded bg-[var(--primary)] text-white font-semibold" onClick={handleEditSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete User Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--bg-light)] rounded-xl p-6 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-[var(--danger)]">Delete User</h3>
            <p>Are you sure you want to delete <span className="font-bold">{deleteUser.name || deleteUser.email}</span>? This cannot be undone.</p>
            <div className="flex gap-2 mt-6 justify-end">
              <button className="px-3 py-1 rounded bg-[var(--primary)] text-white font-semibold" onClick={() => setDeleteUser(null)} disabled={saving}>Cancel</button>
              <button className="px-3 py-1 rounded bg-[var(--danger)] text-white font-semibold" onClick={handleDelete} disabled={saving}>{saving ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
      {/* App Info Section */}
      <div className="mt-10 text-xs text-[var(--text-muted)] text-center">
        <div>App Version: {appInfo.version}</div>
        <div>Environment: {appInfo.env}</div>
      </div>
      <style jsx global>{`
        @keyframes pop {
          0% { transform: scale(0.7); opacity: 0.5; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop { animation: pop 0.5s cubic-bezier(.4,2,.6,1) both; }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color, i }: { label: string; value: number; color: string; i: number }) {
  return (
    <div
      className="bg-[var(--bg-light)] rounded-xl p-3 sm:p-5 shadow flex flex-col items-center group transition-transform duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer relative overflow-hidden"
    >
      <span
        className={`text-2xl sm:text-3xl font-bold ${color} transition-transform duration-500 group-hover:scale-125 animate-pop`}
        style={{ animationDelay: `${i * 0.1}s` }}
      >
        {value}
      </span>
      <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 transition-colors duration-300 group-hover:text-[var(--primary)] text-center">{label}</span>
      {/* Animated background effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-[var(--primary)] to-[var(--danger)] pointer-events-none" />
    </div>
  );
} 