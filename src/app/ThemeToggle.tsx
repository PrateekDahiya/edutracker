"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useSettings } from "./components/SettingsProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { settings, setSettings } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Save theme to database when it changes - always call this hook
  useEffect(() => {
    if (settings && theme && theme !== settings.theme) {
      const newSettings = { ...settings, theme: theme as 'light' | 'dark' | 'system' };
      setSettings(newSettings);
      
      // Save to database
      fetch("/api/setting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      }).catch(error => {
        console.error('Failed to save theme to database:', error);
      });
    }
  }, [theme, settings, setSettings]);

  if (!mounted) return null;

  // Toggle between light and dark only (for header button)
  const toggleTheme = () => {
    if (theme === "system") {
      // If system is active, switch to light
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  const isDark = theme === "dark";
  const isSystem = theme === "system";

  return (
    <button
      onClick={toggleTheme}
      className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-[var(--bg-light)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--primary)] hover:text-[var(--btn-text)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl ring-2 ring-transparent focus:ring-[var(--primary)] flex items-center justify-center"
      aria-label="Toggle theme"
      title={`Current: ${isSystem ? "System" : isDark ? "Dark" : "Light"} theme`}
    >
      <span className="text-sm sm:text-base">{isSystem ? "💻" : isDark ? "🌙" : "☀️"}</span>
    </button>
  );
}
