'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Proper TypeScript types for settings
export interface Settings {
  user_id: string;
  lectureDuration: number;
  labDuration: number;
  semesterStart?: string;
  semesterEnd?: string;
  notifSound: boolean;
  timeFormat: "12h" | "24h";
  theme: "light" | "dark" | "system";
}

interface SettingsContextType {
  settings: Settings | null;
  setSettings: (settings: Settings | null) => void;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

// Cache utility functions
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEYS = {
  SETTINGS_DATA: 'settings_data',
  SETTINGS_LAST_UPDATE: 'settings_last_update'
};

function getCachedSettings(userEmail: string): Settings | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEYS.SETTINGS_DATA}_${userEmail}`);
    const lastUpdate = localStorage.getItem(`${CACHE_KEYS.SETTINGS_LAST_UPDATE}_${userEmail}`);
    
    if (!cached || !lastUpdate) return null;
    
    const data: Settings = JSON.parse(cached);
    const lastUpdateTime = parseInt(lastUpdate);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - lastUpdateTime < CACHE_DURATION) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading settings cache:', error);
    return null;
  }
}

function setCachedSettings(userEmail: string, data: Settings): void {
  try {
    localStorage.setItem(`${CACHE_KEYS.SETTINGS_DATA}_${userEmail}`, JSON.stringify(data));
    localStorage.setItem(`${CACHE_KEYS.SETTINGS_LAST_UPDATE}_${userEmail}`, Date.now().toString());
  } catch (error) {
    console.error('Error writing settings cache:', error);
  }
}

function clearSettingsCache(userEmail: string): void {
  try {
    localStorage.removeItem(`${CACHE_KEYS.SETTINGS_DATA}_${userEmail}`);
    localStorage.removeItem(`${CACHE_KEYS.SETTINGS_LAST_UPDATE}_${userEmail}`);
  } catch (error) {
    console.error('Error clearing settings cache:', error);
  }
}

async function fetchSettings(userEmail: string): Promise<Settings | null> {
  try {
  const res = await fetch(`/api/setting?user_id=${encodeURIComponent(userEmail)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch settings: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = async () => {
    const userEmail = session?.user?.email;
    if (!userEmail || typeof userEmail !== 'string') return;
    setLoading(true);
    setError(null);
    
    try {
      // Clear cache to force fresh fetch
      clearSettingsCache(userEmail);
      const data = await fetchSettings(userEmail);
      
      if (data) {
        setSettings(data);
        setCachedSettings(userEmail, data);
      } else {
        setError('Failed to load settings');
      }
    } catch {
      setSettings(null); // Changed from defaultSettings to null
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userEmail = session?.user?.email;
    if (userEmail && typeof userEmail === 'string') {
      setLoading(true);
      setError(null);
      
      // Try to get cached settings first
      const cachedSettings = getCachedSettings(userEmail);
      
      if (cachedSettings) {
        setSettings(cachedSettings);
        setLoading(false);
        
        // Update in background if cache is getting old (after 3 minutes)
        const now = Date.now();
        const lastUpdate = localStorage.getItem(`${CACHE_KEYS.SETTINGS_LAST_UPDATE}_${userEmail}`);
        if (lastUpdate && (now - parseInt(lastUpdate)) > 3 * 60 * 1000) {
          fetchSettings(userEmail).then(data => {
            if (data) {
              setSettings(data);
              setCachedSettings(userEmail, data);
            }
          });
        }
      } else {
        // No cache, fetch from API
        fetchSettings(userEmail).then(data => {
          if (data) {
            setSettings(data);
            setCachedSettings(userEmail, data);
          } else {
            setError('Failed to load settings');
          }
          setLoading(false);
        }).catch(() => {
          setError('Failed to load settings');
          setLoading(false);
        });
      }
    }
  }, [session]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, loading, error, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 