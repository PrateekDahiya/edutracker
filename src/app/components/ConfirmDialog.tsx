"use client";
import { useState, useEffect } from "react";

interface ConfirmDialogProps {
  message: string;
  title?: string;
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({ 
  message, 
  title = "Confirm Action",
  isVisible, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info"
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getIcon = () => {
    switch (type) {
      case "danger": return "⚠️";
      case "warning": return "⚠️";
      case "info": return "ℹ️";
      default: return "ℹ️";
    }
  };

  const getColors = () => {
    switch (type) {
      case "danger":
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
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          isVisible 
            ? 'opacity-100' 
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCancel}
      >
        <div className="absolute inset-0 bg-[var(--bg-dark)]/50 backdrop-blur-sm" />
      </div>

      {/* Dialog */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95 pointer-events-none'
      }`}>
        <div className={`
          bg-[var(--bg-light)] rounded-2xl shadow-2xl border-2 border-[var(--border)] 
          p-8 max-w-md w-full mx-4 transform transition-all duration-300
          ${isVisible ? 'translate-y-0' : 'translate-y-4'}
        `}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl">{getIcon()}</span>
            <h3 className="text-xl font-bold text-[var(--text)]">{title}</h3>
          </div>

          {/* Message */}
          <p className="text-[var(--text-muted)] text-lg mb-8 leading-relaxed">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-xl border-2 border-[var(--border)] text-[var(--text)] font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent focus:ring-[var(--border)]"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent focus:ring-[var(--primary)] ${colors.bg} ${colors.text} ${colors.hover}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook for easy confirmation usage
export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    message: string;
    title?: string;
    isVisible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
  }>({
    message: "",
    isVisible: false,
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showConfirm = (
    message: string, 
    onConfirm: () => void, 
    options?: {
      title?: string;
      confirmText?: string;
      cancelText?: string;
      type?: "danger" | "warning" | "info";
    }
  ) => {
    setConfirmState({
      message,
      title: options?.title,
      isVisible: true,
      onConfirm: () => {
        onConfirm();
        setConfirmState(prev => ({ ...prev, isVisible: false }));
      },
      onCancel: () => {
        setConfirmState(prev => ({ ...prev, isVisible: false }));
      },
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      type: options?.type,
    });
  };

  const ConfirmComponent = () => (
    <ConfirmDialog
      message={confirmState.message}
      title={confirmState.title}
      isVisible={confirmState.isVisible}
      onConfirm={confirmState.onConfirm}
      onCancel={confirmState.onCancel}
      confirmText={confirmState.confirmText}
      cancelText={confirmState.cancelText}
      type={confirmState.type}
    />
  );

  return { showConfirm, ConfirmComponent };
} 