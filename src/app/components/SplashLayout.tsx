"use client";
import { useState, useEffect } from "react";
import { SplashScreen } from "./LoadingSpinner";

export default function SplashLayout({ children, loading }: { children: React.ReactNode, loading: boolean }) {
  const [showSplash, setShowSplash] = useState(true);
  const [timerDone, setTimerDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false); // new state to control opacity

  useEffect(() => {
    const timer = setTimeout(() => setTimerDone(true), 2000); // slide after 2s
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (timerDone && !loading) {
      const fadeTimer = setTimeout(() => setFadeOut(true), 700); // fade out after slide
      const hideTimer = setTimeout(() => setShowSplash(false), 1400); // unmount after fade
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [timerDone, loading]);

  return (
    <div className="relative w-full h-full min-h-screen">
      {showSplash && (
        <div
          className={`fixed inset-0 z-[99999] flex items-center justify-center bg-[var(--bg)]
            transform transition-transform duration-700 ease-in-out
            ${timerDone && !loading ? '-translate-y-full' : 'translate-y-0'}
            ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            transition-opacity duration-300`}
        >
          <SplashScreen />
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
