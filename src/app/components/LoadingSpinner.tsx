"use client";
import Image from "next/image";

export default function LoadingSpinner({ className = "", withLogo = false }: { className?: string, withLogo?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {withLogo && (
        <Image
          src="/logo.png"
          alt="EduTracker Logo"
          width={64}
          height={64}
          className="mb-4 animate-fadeinout"
        />
      )}
      <svg className="animate-spin h-8 w-8 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <style jsx>{`
        .animate-fadeinout {
          animation: fadeinout 2s linear infinite;
        }
        @keyframes fadeinout {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[var(--bg)] transition-transform duration-700" id="splash-root">
      <Image
        src="/logo.png"
        alt="EduTracker Logo"
        width={96}
        height={96}
        className="mb-4 animate-fadeinout"
      />
      <span className="text-2xl font-bold text-[var(--primary)] animate-fadeinout">EduTracker</span>
      <style jsx>{`
        .animate-fadeinout {
          animation: fadeinout 2s linear infinite;
        }
        @keyframes fadeinout {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
} 