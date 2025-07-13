"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "../components/SettingsProvider";
import type { Settings } from "../components/SettingsProvider";
import { useAlert } from "../components/AlertPopup";

export default function Settings() {
  const { settings, setSettings, loading, error, refreshSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const { showAlert, AlertComponent } = useAlert();
  const [showReset, setShowReset] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Local state for form fields, initialized from settings
  const [lectureDuration, setLectureDuration] = useState(60);
  const [labDuration, setLabDuration] = useState(120);
  const [semesterStart, setSemesterStart] = useState("");
  const [semesterEnd, setSemesterEnd] = useState("");
  const [notifSound, setNotifSound] = useState(true);
  const [timeFormat, setTimeFormat] = useState("12h");

  // Sync local state with settings when loaded
  useEffect(() => {
    if (settings) {
      setLectureDuration(settings.lectureDuration ?? 60);
      setLabDuration(settings.labDuration ?? 120);
      setSemesterStart(settings.semesterStart ?? "");
      setSemesterEnd(settings.semesterEnd ?? "");
      setNotifSound(settings.notifSound ?? true);
      setTimeFormat(settings.timeFormat ?? "12h");
      setMounted(true);
  }
  }, [settings]);

  async function saveSettingsToDB(newSettings: Settings) {
    const res = await fetch("/api/setting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
    return res.json();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    const newSettings = {
      user_id: settings.user_id,
      lectureDuration,
      labDuration,
      semesterStart,
      semesterEnd,
      notifSound,
      timeFormat: timeFormat as '12h' | '24h',
      theme: (theme || "light") as 'light' | 'dark' | 'system',
    };
    await saveSettingsToDB(newSettings);
    setSettings(newSettings);
    refreshSettings();
    showAlert("Settings saved successfully!", "success");
  }

  async function handleReset() {
    if (!settings) return;
    
    try {
      const defaultSettings = {
        user_id: settings.user_id,
        lectureDuration: 60,
        labDuration: 120,
        semesterStart: "",
        semesterEnd: "",
        notifSound: true,
        timeFormat: "12h" as '12h',
        theme: "light" as 'light',
      };
      
      await saveSettingsToDB(defaultSettings);
      setSettings(defaultSettings);
      refreshSettings();
      
      // Update local state to reflect reset
      setLectureDuration(60);
      setLabDuration(120);
      setSemesterStart("");
      setSemesterEnd("");
      setNotifSound(true);
      setTimeFormat("12h");
      
      showAlert("Settings reset to defaults successfully!", "success");
      setShowReset(false);
    } catch (error) {
      showAlert("Failed to reset settings. Please try again.", "error");
    }
  }

  if (loading || !mounted) return null;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Settings</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-muted)]">Customize your experience</span>
        </div>
      </div>
      
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            <span className="text-[var(--text-muted)] text-lg">Loading settings...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-6 bg-[var(--danger)]/10 border border-[var(--danger)] rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
          <div>
              <div className="text-[var(--danger)] font-semibold text-lg">Error loading settings</div>
              <div className="text-[var(--danger)]/80">{error}</div>
            </div>
          </div>
        </div>
      )}
      
      {!loading && !error && (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Class Duration Settings */}
          <div className="bg-[var(--bg-light)] rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer">
            <div className="bg-[var(--primary)]/10 border-b border-[var(--border)] px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[var(--text)]">Class Duration Settings</h2>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1">Set default durations for lectures and labs</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[var(--text)] font-semibold text-lg">Lecture Duration</label>
                  <div className="flex items-center gap-3">
            <input
              type="number"
              min={30}
              max={180}
              value={lectureDuration}
              onChange={(e) => setLectureDuration(Number(e.target.value))}
                      className="flex-1 p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200"
            />
                    <span className="text-[var(--text-muted)] font-medium">minutes</span>
                  </div>
          </div>
                <div className="space-y-2">
                  <label className="block text-[var(--text)] font-semibold text-lg">Lab Duration</label>
                  <div className="flex items-center gap-3">
            <input
              type="number"
              min={30}
              max={240}
              value={labDuration}
              onChange={(e) => setLabDuration(Number(e.target.value))}
                      className="flex-1 p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200"
            />
                    <span className="text-[var(--text-muted)] font-medium">minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Semester Settings */}
          <div className="bg-[var(--bg-light)] rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer">
            <div className="bg-[var(--primary)]/10 border-b border-[var(--border)] px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[var(--text)]">Semester Settings</h2>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1">Define your academic period</p>
        </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[var(--text)] font-semibold text-lg">Start Date</label>
            <input
              type="date"
              value={semesterStart}
              onChange={(e) => setSemesterStart(e.target.value)}
                    className="w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200"
            />
          </div>
                <div className="space-y-2">
                  <label className="block text-[var(--text)] font-semibold text-lg">End Date</label>
            <input
              type="date"
              value={semesterEnd}
              onChange={(e) => setSemesterEnd(e.target.value)}
                    className="w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200"
            />
                </div>
              </div>
          </div>
        </div>

          {/* Display & Notification Settings */}
          <div className="bg-[var(--bg-light)] rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer">
            <div className="bg-[var(--primary)]/10 border-b border-[var(--border)] px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[var(--text)]">Display & Notifications</h2>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1">Customize your interface and alerts</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] hover:border-[var(--primary)] transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-[var(--text)] font-semibold text-lg">Notification Sound</div>
                    <div className="text-sm text-[var(--text-muted)]">Play sound for class reminders</div>
                  </div>
                </div>
            <button
              type="button"
              aria-pressed={notifSound}
              onClick={() => setNotifSound(v => !v)}
                  className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 border-2 border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${notifSound ? 'bg-[var(--primary)]' : 'bg-[var(--border-muted)]'} cursor-pointer hover:scale-105 hover:shadow-lg`}
            >
              <span
                    className={`h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${notifSound ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
          </div>
          
              <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] hover:border-[var(--primary)] transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-[var(--text)] font-semibold text-lg">Time Format</div>
                    <div className="text-sm text-[var(--text-muted)]">Choose 12 or 24 hour display</div>
                  </div>
                </div>
            <select
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200"
            >
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
              </div>
          </div>
        </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6">
          <button
            type="submit"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 ring-2 ring-transparent focus:ring-[var(--primary)] cursor-pointer"
          >
              Save Settings
          </button>
          <button
            type="button"
            onClick={() => setShowReset(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--danger)] text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 ring-2 ring-transparent focus:ring-[var(--danger)] cursor-pointer"
          >
              Reset to Defaults
          </button>
        </div>
      </form>
      )}

      {/* Reset Confirmation Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--bg-light)] p-8 rounded-2xl shadow-2xl border border-[var(--border)] max-w-md mx-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-[var(--danger)] mb-2">Reset Settings</h3>
              <p className="text-[var(--text-muted)] mb-6">This will reset all settings to their default values. This action cannot be undone.</p>
              <div className="flex gap-4 justify-center">
              <button
                onClick={handleReset}
                  className="px-6 py-3 rounded-xl bg-[var(--danger)] text-white font-semibold hover:bg-[var(--danger)]/90 transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowReset(false)}
                  className="px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--btn-text)] font-semibold hover:bg-[var(--primary)]/90 transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                Cancel
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AlertComponent />
    </div>
  );
}
