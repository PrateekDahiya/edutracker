"use client";
import { useState, useEffect } from "react";

interface AlertPopupProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function AlertPopup({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 3000 
}: AlertPopupProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success": return "✅";
      case "error": return "❌";
      case "warning": return "⚠️";
      case "info": return "ℹ️";
      default: return "ℹ️";
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-[var(--success)]",
          border: "border-[var(--success)]",
          text: "text-white",
          hover: "hover:bg-[var(--success)]/90"
        };
      case "error":
        return {
          bg: "bg-[var(--danger)]",
          border: "border-[var(--danger)]",
          text: "text-white",
          hover: "hover:bg-[var(--danger)]/90"
        };
      case "warning":
        return {
          bg: "bg-[var(--warning)]",
          border: "border-[var(--warning)]",
          text: "text-white",
          hover: "hover:bg-[var(--warning)]/90"
        };
      case "info":
        return {
          bg: "bg-[var(--primary)]",
          border: "border-[var(--primary)]",
          text: "text-white",
          hover: "hover:bg-[var(--primary)]/90"
        };
      default:
        return {
          bg: "bg-[var(--primary)]",
          border: "border-[var(--primary)]",
          text: "text-white",
          hover: "hover:bg-[var(--primary)]/90"
        };
    }
  };

  const colors = getColors();

  if (!mounted) return null;

  return (
    <div className={`fixed top-20 sm:top-[7.5rem] right-2 sm:right-4 z-60 transition-all duration-300 ${
      isVisible 
        ? 'opacity-100 translate-x-0 scale-100' 
        : 'opacity-0 translate-x-full scale-95'
    }`}>
      <div className={`
        flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl border-2
        w-[95vw] max-w-xs sm:max-w-md text-sm sm:text-lg
        ${colors.bg} ${colors.border} ${colors.text}
        hover:shadow-3xl transition-all duration-200 cursor-pointer
        group hover:scale-105 hover:-translate-y-1
      `}>
        <span className="text-2xl group-hover:scale-125 transition-transform duration-200">
          {getIcon()}
        </span>
        <span className="font-semibold text-sm sm:text-lg break-words">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors duration-200"
        >
          <span className="text-lg">×</span>
        </button>
      </div>
    </div>
  );
}

// Hook for easy alert usage
export function useAlert() {
  const [alertState, setAlertState] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  const showAlert = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setAlertState({
      message,
      type,
      isVisible: true,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, isVisible: false }));
  };

  const AlertComponent = () => (
    <AlertPopup
      message={alertState.message}
      type={alertState.type}
      isVisible={alertState.isVisible}
      onClose={hideAlert}
    />
  );

  return { showAlert, AlertComponent };
} 

/* Responsive floating warning styles */
<style jsx global>{`
  .floating-warning {
    left: 1rem;
    bottom: 1rem;
    z-index: 60;
    position: fixed;
    max-width: 90vw;
  }
  @media (max-width: 640px) {
    .floating-warning {
      left: 0;
      right: 0;
      bottom: 4.5rem; /* above bottom nav/AI agent */
      margin: 0 auto;
      width: 95vw;
      max-width: 95vw;
      border-radius: 1rem;
      text-align: center;
      justify-content: center;
    }
  }
`}</style> 