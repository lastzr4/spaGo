"use client";

import { useState } from "react";
import { UserIcon, TrashIcon, CheckCircleIcon } from "@/components/icons";

export default function DemoDataPanel() {
  const [loading, setLoading] = useState<"seed" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSeed() {
    setLoading("seed");
    setMessage(null);
    const res = await fetch("/api/admin/seed-demo", { method: "POST" });
    const data = await res.json().catch(() => null);
    setLoading(null);
    setMessage(res.ok ? `${data.createdCount} terapis demo dijana.` : "Gagal menjana data demo.");
  }

  async function handleDelete() {
    setLoading("delete");
    setMessage(null);
    const res = await fetch("/api/admin/seed-demo", { method: "DELETE" });
    const data = await res.json().catch(() => null);
    setLoading(null);
    setMessage(res.ok ? `${data.deletedCount} terapis demo dipadam.` : "Gagal memadam data demo.");
  }

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <UserIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-brand-900">Data Demo</p>
          <p className="text-xs text-gray-500">Jana 10 terapis contoh (dengan servis, slot &amp; ulasan) untuk lihat macam mana app populate.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={handleSeed} className="btn-secondary flex-1" disabled={loading !== null}>
          {loading === "seed" ? "Menjana..." : "Jana 10 Terapis"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-red-100 bg-white px-5 py-3.5 text-[15px] font-semibold text-red-500 shadow-card transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
          disabled={loading !== null}
        >
          <TrashIcon className="h-4 w-4" />
          {loading === "delete" ? "Memadam..." : "Padam Data Demo"}
        </button>
      </div>

      {message && (
        <p className="flex items-center gap-1.5 rounded-xl bg-brand-50/60 px-3.5 py-2.5 text-sm font-medium text-brand-700">
          <CheckCircleIcon filled className="h-4 w-4" />
          {message}
        </p>
      )}
    </div>
  );
}
