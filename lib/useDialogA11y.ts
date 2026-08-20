"use client";

import { useEffect, useRef } from "react";

// Minimal, dependency-free a11y helper shared by every full-screen sheet/
// modal in the app (ConfirmDialog, ServiceDetailSheet, RescheduleSheet, the
// SlotManager booking-detail sheet). These are plain positioned <div>s with
// a backdrop onClick — functional for mouse/touch, but invisible to
// keyboard and screen-reader users: no dialog role, no Escape-to-close, and
// focus is left wherever it was on the page underneath. This hook closes
// on Escape and moves focus into the panel on open, without changing any
// visual layout or existing click behavior.
//
// `active` guards the effect rather than gating the hook call itself — some
// callers (ConfirmDialog) render unconditionally and toggle visibility via
// an `open` prop, so the hook must always be called in the same order.
export function useDialogA11y(active: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    panelRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, onClose]);

  return panelRef;
}
