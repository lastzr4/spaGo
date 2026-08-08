"use client";

import { useEffect } from "react";
import { BackspaceIcon, LockIcon } from "@/components/icons";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "backspace"] as const;

export default function PinPadInput({
  value,
  onChange,
  open,
  onOpenChange,
  label = "Masukkan PIN",
  placeholder = "PIN",
  maxLength = 6,
  minLength = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function press(key: string) {
    if (key === "backspace") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === "" || value.length >= maxLength) return;
    onChange(value + key);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="input flex items-center justify-between text-left"
      >
        <span className={value ? "text-lg tracking-[8px] text-brand-900" : "text-gray-400"}>
          {value ? "•".repeat(value.length) : placeholder}
        </span>
        <LockIcon className="h-4 w-4 shrink-0 text-brand-300" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in"
          onClick={() => onOpenChange(false)}
        >
          <div
            className="safe-bottom w-full max-w-md rounded-t-3xl bg-white p-5 animate-modal-in sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-900">{label}</p>
              <button type="button" onClick={() => onOpenChange(false)} className="text-xs font-semibold text-brand-600 active:opacity-60">
                Selesai
              </button>
            </div>

            <div className="mb-2 flex items-center justify-center gap-3">
              {Array.from({ length: maxLength }).map((_, i) => (
                <span
                  key={i}
                  className={`h-3 w-3 rounded-full transition-all duration-150 ${
                    i < value.length ? "scale-110 bg-brand-600" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="mb-6 text-center text-[11px] text-gray-400">Minimum {minLength} digit</p>

            <div className="grid grid-cols-3 gap-3">
              {KEYS.map((key, i) =>
                key === "" ? (
                  <span key={`blank-${i}`} />
                ) : key === "backspace" ? (
                  <button
                    key={key}
                    type="button"
                    onClick={() => press(key)}
                    aria-label="Padam"
                    className="card-tap flex aspect-square items-center justify-center rounded-full bg-gray-50 text-brand-900 active:bg-brand-50"
                  >
                    <BackspaceIcon className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    key={key}
                    type="button"
                    onClick={() => press(key)}
                    className="card-tap flex aspect-square items-center justify-center rounded-full bg-gray-50 text-xl font-semibold text-brand-900 active:bg-brand-50"
                  >
                    {key}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
