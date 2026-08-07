"use client";

import { useState } from "react";
import { ShareIcon, CheckCircleIcon } from "@/components/icons";

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or share failed; fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
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
      className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-transform active:scale-90"
      aria-label="Kongsi"
    >
      {copied ? <CheckCircleIcon filled className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />}
    </button>
  );
}
