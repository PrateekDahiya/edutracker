import React from "react";

interface SemesterModalProps {
  isOpen: boolean;
  semesterStart: string;
  semesterEnd: string;
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  error?: string;
  warning?: string;
}

const SemesterModal: React.FC<SemesterModalProps> = ({
  isOpen,
  semesterStart,
  semesterEnd,
  onChangeStart,
  onChangeEnd,
  onSave,
  onClose,
  saving,
  error,
  warning,
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-dark)]/30"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg-light)] rounded-2xl shadow-2xl border-2 border-[var(--primary)] p-8 max-w-md w-full mx-4 relative" onClick={e => e.stopPropagation()}>
        <button
          className="absolute top-3 right-3 text-2xl text-[var(--danger)] hover:scale-125 transition"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-[var(--primary)]">Set Semester Dates</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave();
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1 text-left">
            <span className="font-semibold text-[var(--text)]">Semester Start</span>
            <input type="date" value={semesterStart} onChange={e => onChangeStart(e.target.value)} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)]" required />
          </label>
          <label className="flex flex-col gap-1 text-left">
            <span className="font-semibold text-[var(--text)]">Semester End</span>
            <input type="date" value={semesterEnd} onChange={e => onChangeEnd(e.target.value)} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)]" required />
          </label>
          {error && <div className="text-[var(--danger)] text-sm font-semibold">{error}</div>}
          <button type="submit" disabled={saving} className="mt-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--btn-text)] font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-60">
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
        {warning && (
          <div className="mt-4 bg-[var(--warning)] text-white px-4 py-2 rounded-xl shadow font-semibold text-center animate-fadein">
            {warning}
          </div>
        )}
      </div>
    </div>
  );
};

export default SemesterModal; 