"use client";

import { useState } from "react";
import { ShareIcon, CheckCircleIcon } from "@/components/icons";

export default function ShareButton({ title, url }: { title: string; url?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    // Callers on the therapist profile pages are Server Components, where
    // `window` never exists — a `url` computed there (e.g. via
    // `typeof window !== "undefined" ? window.location.href : ""`) is
    // always the empty-string fallback, so sharing/copying would silently
    // send nothing. Falling back to the current page's own URL here, at
    // click time inside this Client Component, is where `window` is
    // actually available and correct regardless of what the caller passed.
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // user cancelled or share failed; fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--surface-2)] text-brand-300 transition-transform active:scale-90"
      aria-label="Kongsi"
    >
      {copied ? <CheckCircleIcon filled className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />}
    </button>
  );
}
