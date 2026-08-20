"use client";

import { useState } from "react";
import { SparkleIcon } from "@/components/icons";

export default function ReviewSummaryPanel({
  token,
  initialSummary,
  reviewCount,
}: {
  token: string;
  initialSummary: string | null;
  reviewCount: number;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/${token}/ai/review-summary`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.summary) {
        setError(data?.error === "NO_REVIEWS" ? "Belum ada ulasan untuk diringkaskan." : "Gagal menjana ringkasan.");
        return;
      }
      setSummary(data.summary);
    } catch {
      setError("Gagal menjana ringkasan.");
    } finally {
      setLoading(false);
    }
  }

  if (reviewCount === 0) return null;

  return (
    <div className="card mb-4 flex flex-col gap-2 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-[color:var(--text-primary)]">
          <SparkleIcon className="h-4 w-4 text-brand-500" />
          Ringkasan AI
        </p>
        <button
          type="button"
          onClick={regenerate}
          disabled={loading}
          className="text-xs font-semibold text-brand-300 active:opacity-60 disabled:opacity-40"
        >
          {loading ? "Menjana..." : summary ? "Kemaskini" : "Jana"}
        </button>
      </div>
      {summary ? (
        <p className="text-sm italic text-[color:var(--text-secondary)]">&ldquo;{summary}&rdquo;</p>
      ) : (
        <p className="text-xs text-[color:var(--text-muted)]">Jana ringkasan pendek daripada ulasan pelanggan anda menggunakan AI.</p>
      )}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
