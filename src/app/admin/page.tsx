"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import LoadingSpinner from "../components/LoadingSpinner";

const ADMIN_TABS = [
  { key: "analytics", label: "Analytics" },
  { key: "users", label: "Users" },
  { key: "export", label: "Export" },
];

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEYS = {
  ADMIN_STATS: 'admin_stats',
  ADMIN_ANALYTICS: 'admin_analytics',
  LAST_UPDATE: 'admin_last_update',
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("analytics");
  const [stats, setStats] = useState<any>(null); // user stats
  const [analytics, setAnalytics] = useState<any>(null); // analytics
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [impersonateUser, setImpersonateUser] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [appInfo] = useState({
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    env: process.env.NODE_ENV,
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Cache helpers
  function getCachedData(userId: string) {
    try {
      const stats = localStorage.getItem(`${CACHE_KEYS.ADMIN_STATS}_${userId}`);
      const analytics = localStorage.getItem(`${CACHE_KEYS.ADMIN_ANALYTICS}_${userId}`);
      const lastUpdate = localStorage.getItem(`${CACHE_KEYS.LAST_UPDATE}_${userId}`);
      if (!stats || !analytics || !lastUpdate) return null;
      const now = Date.now();
      if (now - parseInt(lastUpdate) < CACHE_DURATION) {
        return {
          stats: JSON.parse(stats),
          analytics: JSON.parse(analytics),
          lastUpdate: new Date(parseInt(lastUpdate)),
        };
      }
      return null;
    } catch (e) { return null; }
  }
  function setCachedData(userId: string, stats: any, analytics: any) {
    try {
      localStorage.setItem(`${CACHE_KEYS.ADMIN_STATS}_${userId}`, JSON.stringify(stats));
      localStorage.setItem(`${CACHE_KEYS.ADMIN_ANALYTICS}_${userId}`, JSON.stringify(analytics));
      localStorage.setItem(`${CACHE_KEYS.LAST_UPDATE}_${userId}`, Date.now().toString());
    } catch (e) {}
  }
  function clearCache(userId: string) {
    try {
      localStorage.removeItem(`${CACHE_KEYS.ADMIN_STATS}_${userId}`);
      localStorage.removeItem(`${CACHE_KEYS.ADMIN_ANALYTICS}_${userId}`);
      localStorage.removeItem(`${CACHE_KEYS.LAST_UPDATE}_${userId}`);
    } catch (e) {}
  }

  // Fetch analytics and user stats with cache
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || !(session.user as any).isAdmin) {
      router.replace("/dashboard");
      return;
    }
    const userId = (session.user as any).user_id;
    const cached = getCachedData(userId);
    if (cached) {
      setStats(cached.stats);
      setAnalytics(cached.analytics);
      setLastUpdate(cached.lastUpdate);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch("/api/user?all=1").then((res) => res.json()),
      fetch("/api/admin/analytics").then((res) => res.json()),
    ])
      .then(([userStats, analyticsData]) => {
        setStats(userStats);
        setAnalytics(analyticsData);
        setCachedData(userId, userStats, analyticsData);
        setLastUpdate(new Date());
      })
      .finally(() => setLoading(false));
  }, [session, status, router]);

  // Fetch activity logs
  useEffect(() => {
    if (activeTab === "activity") {
      fetch("/api/admin/activity-logs").then(res => res.json()).then(setActivityLogs);
    }
  }, [activeTab]);

  // Fetch audit logs
  useEffect(() => {
    if (activeTab === "audit") {
      fetch("/api/admin/audit").then(res => res.json()).then(setAuditLogs);
    }
  }, [activeTab]);

  // Fetch DB stats
  useEffect(() => {
    if (activeTab === "db") {
      fetch("/api/admin/db-stats").then(res => res.json()).then(setDbStats);
    }
  }, [activeTab]);

  // Fetch App Settings
  useEffect(() => {
    if (activeTab === "settings") {
      fetch("/api/admin/app-settings").then(res => res.json()).then(setAppSettings);
    }
  }, [activeTab]);

  // Global refresh handler
  const handleRefresh = () => {
    if (!session?.user) return;
    const userId = (session.user as any).user_id;
    clearCache(userId);
    setLoading(true);
    // Fetch all data for all tabs
    Promise.all([
      fetch("/api/user?all=1").then((res) => res.json()),
      fetch("/api/admin/analytics").then((res) => res.json()),
      fetch("/api/admin/activity-logs").then(res => res.json()),
      fetch("/api/admin/audit").then(res => res.json()),
      fetch("/api/admin/db-stats").then(res => res.json()),
      fetch("/api/admin/app-settings").then(res => res.json()),
    ])
      .then(([userStats, analyticsData, activity, audit, db, settings]) => {
        setStats(userStats);
        setAnalytics(analyticsData);
        setCachedData(userId, userStats, analyticsData);
        setLastUpdate(new Date());
        setActivityLogs(activity);
        setAuditLogs(audit);
        setDbStats(db);
        setAppSettings(settings);
      })
      .finally(() => setLoading(false));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><LoadingSpinner className="scale-125" /></div>;
  if (!stats || !analytics) return <div className="p-8 text-center text-red-500">Failed to load admin data.</div>;

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;
    setSaving(true);
    await fetch("/api/admin/bulk-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, user_ids: selectedUsers }),
    });
    // Refresh user stats
    fetch("/api/user?all=1").then((r) => r.json()).then(setStats);
    setSelectedUsers([]);
    setSaving(false);
  };

  // Impersonate user
  const handleImpersonate = async (user: any) => {
    setImpersonateUser("loading");
    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    const data = await res.json();
    setImpersonateUser(data.user || null);
    // In production, you would redirect or set a session token
  };

  // Export data
  const handleExport = async (type: string) => {
    setExporting(true);
    const res = await fetch(`/api/admin/export?type=${type}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}.csv`;
    a.click();
    setExporting(false);
  };

  // App settings update
  const handleSettingsSave = async (settings: any) => {
    await fetch("/api/admin/app-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setAppSettings(settings);
  };

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4">
      {/* Global Refresh Button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Admin Panel</h1>
        <button
          className="px-3 py-2 rounded bg-[var(--primary)] text-white font-semibold text-sm shadow hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh all admin data"
        >
          {loading ? "Refreshing..." : "Refresh All"}
        </button>
      </div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
        {ADMIN_TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-3 py-2 font-semibold border-b-2 transition-colors duration-200 cursor-pointer rounded-t-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${activeTab === tab.key ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--bg-light)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-light)]/70"}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      {activeTab === "analytics" && (
        <div>
          {/* Header with last update */}
          <div className="flex flex-col mb-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text)]">Admin Analytics</span>
            <span className="text-xs sm:text-sm text-[var(--text-muted)]">All user and app statistics</span>
            {lastUpdate && <span className="text-xs text-[var(--text-muted)] mt-1">Last updated: {lastUpdate.toLocaleString()}</span>}
          </div>
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <StatCard label="Total Users" value={analytics.totalUsers} color="text-[var(--primary)]" i={0} />
            <StatCard label="Total Tasks" value={analytics.totalTasks} color="text-[var(--primary)]" i={1} />
            <StatCard label="Completed Tasks" value={analytics.completedTasks} color="text-[var(--success)]" i={2} />
            <StatCard label="Total Attendance" value={analytics.totalAttendance} color="text-[var(--primary)]" i={3} />
            <StatCard label="Total Classes" value={analytics.totalClasses} color="text-[var(--primary)]" i={4} />
          </div>
          {/* Analytics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* User Growth Chart */}
            <div className="bg-[var(--bg-light)] rounded-xl p-4 shadow flex flex-col">
              <h3 className="font-semibold mb-2 text-[var(--text)]">User Growth (by Month)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={Object.entries(analytics.userGrowth).map(([month, count]) => ({ month, count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Task Completion Chart */}
            <div className="bg-[var(--bg-light)] rounded-xl p-4 shadow flex flex-col">
              <h3 className="font-semibold mb-2 text-[var(--text)]">Task Completion</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[{ name: "Completed", value: analytics.completedTasks }, { name: "Total", value: analytics.totalTasks }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      {activeTab === "users" && (
        <div>
          {/* Bulk Actions Bar */}
          <div className="flex flex-wrap gap-2 mb-2 items-center">
            <button className="px-2 py-1 rounded bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" disabled={saving || selectedUsers.length === 0} onClick={() => handleBulkAction("activate")}>Activate</button>
            <button className="px-2 py-1 rounded bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" disabled={saving || selectedUsers.length === 0} onClick={() => handleBulkAction("deactivate")}>Deactivate</button>
            <button className="px-2 py-1 rounded bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" disabled={saving || selectedUsers.length === 0} onClick={() => handleBulkAction("setAdmin")}>Set Admin</button>
            <button className="px-2 py-1 rounded bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" disabled={saving || selectedUsers.length === 0} onClick={() => handleBulkAction("unsetAdmin")}>Unset Admin</button>
            <button className="px-2 py-1 rounded bg-[var(--danger)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--danger)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--danger)]" disabled={saving || selectedUsers.length === 0} onClick={() => handleBulkAction("delete")}>Delete</button>
            <span className="ml-2 text-xs text-[var(--text-muted)]">{selectedUsers.length} selected</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm bg-[var(--bg-light)] rounded-xl shadow">
              <thead>
                <tr className="bg-[var(--bg)]">
                  <th className="p-2 border text-center"><input type="checkbox" checked={selectedUsers.length === stats.users.length} onChange={e => setSelectedUsers(e.target.checked ? stats.users.map((u: any) => u.user_id) : [])} /></th>
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
                  <tr key={u._id} className={"even:bg-[var(--bg)] hover:bg-[var(--primary)]/10 transition-colors duration-200 cursor-pointer group"}>
                    <td className="p-2 border text-center"><input type="checkbox" checked={selectedUsers.includes(u.user_id)} onChange={e => setSelectedUsers(e.target.checked ? [...selectedUsers, u.user_id] : selectedUsers.filter(id => id !== u.user_id))} /></td>
                    <td className="p-2 border text-[var(--text)]">{u.name || "-"}</td>
                    <td className="p-2 border text-[var(--text)]">{u.email}</td>
                    <td className="p-2 border text-center font-bold text-[var(--primary)]">{u.taskCount}</td>
                    <td className="p-2 border text-center font-bold text-[var(--primary)]">{u.attendanceCount}</td>
                    <td className="p-2 border text-center font-bold text-[var(--primary)]">{u.classCount}</td>
                    <td className="p-2 border text-center">{u.isAdmin ? <span className="text-[var(--success)] font-bold">✔️</span> : ""}</td>
                    <td className="p-2 border text-center flex gap-2 justify-center">
                      <button className="px-2 py-1 rounded bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" onClick={() => setEditUser(u)}>Edit</button>
                      <button className="px-2 py-1 rounded bg-[var(--danger)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--danger)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--danger)]" onClick={() => setDeleteUser(u)}>Delete</button>
                      <button className="px-2 py-1 rounded bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" onClick={() => handleImpersonate(u)}>Impersonate</button>
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
                  <button className="px-3 py-1 rounded bg-[var(--primary)] text-white font-semibold" onClick={async () => { setSaving(true); await fetch("/api/user", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editUser), }); setSaving(false); setEditUser(null); fetch("/api/user?all=1").then((r) => r.json()).then(setStats); }} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
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
                  <button className="px-3 py-1 rounded bg-[var(--danger)] text-white font-semibold" onClick={async () => { setSaving(true); await fetch("/api/user", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: deleteUser.user_id }), }); setSaving(false); setDeleteUser(null); fetch("/api/user?all=1").then((r) => r.json()).then(setStats); }} disabled={saving}>{saving ? "Deleting..." : "Delete"}</button>
                </div>
              </div>
            </div>
          )}
          {/* Impersonate Modal */}
          {impersonateUser && impersonateUser !== "loading" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-[var(--bg-light)] rounded-xl p-6 shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4 text-[var(--primary)]">Impersonation</h3>
                <p>You are now impersonating <span className="font-bold">{impersonateUser.name || impersonateUser.email}</span>. (Demo: No session change)</p>
                <div className="flex gap-2 mt-6 justify-end">
                  <button className="px-3 py-1 rounded bg-[var(--primary)] text-white font-semibold" onClick={() => setImpersonateUser(null)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === "activity" && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-[var(--text)]">User Activity Logs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm bg-[var(--bg-light)] rounded-xl shadow">
              <thead>
                <tr className="bg-[var(--bg)]">
                  <th className="p-2 border text-left">User ID</th>
                  <th className="p-2 border text-left">Type</th>
                  <th className="p-2 border text-left">Description</th>
                  <th className="p-2 border text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log: any, idx: number) => (
                  <tr key={log._id || idx} className={"even:bg-[var(--bg)] hover:bg-[var(--primary)]/10 transition-colors duration-200 cursor-pointer group"}>
                    <td className="p-2 border">{log.user_id}</td>
                    <td className="p-2 border">{log.type}</td>
                    <td className="p-2 border">{log.description || log.details || "-"}</td>
                    <td className="p-2 border">{log.time ? new Date(log.time).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === "audit" && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-[var(--text)]">Admin Audit Trail</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm bg-[var(--bg-light)] rounded-xl shadow">
              <thead>
                <tr className="bg-[var(--bg)]">
                  <th className="p-2 border text-left">Admin ID</th>
                  <th className="p-2 border text-left">Action</th>
                  <th className="p-2 border text-left">Target User</th>
                  <th className="p-2 border text-left">Details</th>
                  <th className="p-2 border text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log: any, idx: number) => (
                  <tr key={log._id || idx} className={"even:bg-[var(--bg)] hover:bg-[var(--primary)]/10 transition-colors duration-200 cursor-pointer group"}>
                    <td className="p-2 border">{log.admin_id}</td>
                    <td className="p-2 border">{log.action}</td>
                    <td className="p-2 border">{log.target_user_id || "-"}</td>
                    <td className="p-2 border">{log.details || "-"}</td>
                    <td className="p-2 border">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === "export" && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-[var(--text)]">Export Data</h2>
          <div className="flex gap-3 flex-wrap mb-4">
            {['users', 'tasks', 'attendance', 'classes'].map(type => (
              <button key={type} className="px-3 py-2 rounded bg-[var(--primary)] text-white font-semibold" onClick={() => handleExport(type)} disabled={exporting}>{exporting ? 'Exporting...' : `Export ${type.charAt(0).toUpperCase() + type.slice(1)}`}</button>
            ))}
          </div>
        </div>
      )}
      {activeTab === "db" && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-[var(--text)]">Database Health</h2>
          {dbStats ? (
            <div className="bg-[var(--bg-light)] rounded-xl p-4 shadow mb-4">
              <div className="mb-2 font-semibold">Collections: {dbStats.collections?.join(', ')}</div>
              <pre className="text-xs overflow-x-auto bg-[var(--bg)] p-2 rounded">{JSON.stringify(dbStats.stats, null, 2)}</pre>
            </div>
          ) : <div>Loading DB stats...</div>}
        </div>
      )}
      {activeTab === "settings" && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-[var(--text)]">App Settings</h2>
          {appSettings ? (
            <form className="flex flex-col gap-3 max-w-md" onSubmit={e => { e.preventDefault(); handleSettingsSave(appSettings); }}>
              <label className="flex flex-col text-sm font-semibold">
                Semester Start
                <input type="date" className="mt-1 p-2 rounded border" value={appSettings.semesterStart || ''} onChange={e => setAppSettings({ ...appSettings, semesterStart: e.target.value })} />
              </label>
              <label className="flex flex-col text-sm font-semibold">
                Semester End
                <input type="date" className="mt-1 p-2 rounded border" value={appSettings.semesterEnd || ''} onChange={e => setAppSettings({ ...appSettings, semesterEnd: e.target.value })} />
              </label>
              <button className="px-3 py-2 rounded bg-[var(--primary)] text-white font-semibold mt-2 self-end" type="submit">Save Settings</button>
            </form>
          ) : <div>Loading settings...</div>}
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