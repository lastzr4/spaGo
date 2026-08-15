"use client";

import { useState } from "react";
import { SparkleIcon } from "@/components/icons";

// One-shot platform-wide backfill button — generates AI photos for every
// existing service/package (across every therapist) that still has none.
// Going forward this happens automatically per-therapist as soon as their
// dashboard loads (see ServiceManager's auto-generate effect); this button
// exists just to catch up anything that predates that behavior in one go.
export default function AdminServiceImageBackfill() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ total: number; generated: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/generate-missing-service-images", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setResult(data);
      } else {
        setError("Gagal menjana gambar. Sila cuba lagi.");
      }
    } catch {
      setError("Gagal menjana gambar. Sila cuba lagi.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="card flex flex-col gap-2.5">
      <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Gambar AI Servis (Semua Terapis)</p>
      <p className="text-xs text-[color:var(--text-secondary)]">
        Jana gambar AI untuk semua servis/pakej sedia ada (merentas semua terapis) yang masih tiada gambar. Servis baru dan gambar
        yang dimuat naik sendiri oleh terapis tidak akan disentuh.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="btn-primary w-fit gap-1.5 disabled:opacity-50"
      >
        <SparkleIcon className="h-4 w-4" />
        {running ? "Sedang menjana..." : "Jana Gambar untuk Servis Tanpa Gambar"}
      </button>
      {result && (
        <p className="rounded-xl bg-emerald-500/15 px-3.5 py-2.5 text-xs font-medium text-emerald-400">
          Selesai — {result.generated} dijana, {result.failed} gagal, daripada {result.total} servis tanpa gambar.
        </p>
      )}
      {error && <p className="rounded-xl bg-red-500/15 px-3.5 py-2.5 text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}
