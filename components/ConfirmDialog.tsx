"use client";

import { AlertTriangleIcon } from "@/components/icons";

/**
 * Styled replacement for the native window.confirm() dialog, used for
 * destructive/important actions (e.g. admin deleting a therapist).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Sahkan",
  cancelLabel = "Batal",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" onClick={onCancel}>
      <div
        className="animate-modal-in w-full max-w-sm rounded-3xl bg-[color:var(--surface-2)] p-5 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${danger ? "bg-red-500/15 text-red-500" : "bg-[color:var(--surface-2)] text-brand-600"}`}>
          <AlertTriangleIcon className="h-5 w-5" />
        </div>
        <h3 className="text-[15px] font-bold text-[color:var(--text-primary)]">{title}</h3>
        <p className="mt-1.5 text-sm text-[color:var(--text-secondary)]">{message}</p>
        <div className="mt-5 flex gap-2.5">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-white shadow-card transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${
              danger ? "bg-red-500/150" : "bg-brand-600"
            }`}
          >
            {busy ? "Sila tunggu..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
