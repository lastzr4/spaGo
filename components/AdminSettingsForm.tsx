"use client";

import { useState } from "react";
import { PaletteIcon, CheckCircleIcon, LogOutIcon } from "@/components/icons";

export default function AdminSettingsForm({
  initialThemeColor,
  initialBackgroundColor,
}: {
  initialThemeColor: string;
  initialBackgroundColor: string;
}) {
  const [themeColor, setThemeColor] = useState(initialThemeColor);
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeColor, backgroundColor }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <PaletteIcon className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold text-brand-900">Tetapan Laman</h1>
        </div>
        <a href="/api/admin/logout" className="btn-ghost flex items-center gap-1 bg-brand-50">
          <LogOutIcon className="h-3.5 w-3.5" />
          Log Keluar
        </a>
      </div>

      <form onSubmit={handleSave} className="card flex flex-col gap-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-900">Warna tema</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-black/10"
            />
            <input
              className="input"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              placeholder="#7a51c9"
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">Digunakan pada butang utama, nav aktif dan hero.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-900">Warna latar belakang</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-black/10"
            />
            <input
              className="input"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              placeholder="#faf9fc"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] p-4" style={{ background: backgroundColor }}>
          <span className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: themeColor }}>
            Pratonton
          </span>
          <span className="text-xs text-gray-500">Contoh warna pada latar app.</span>
        </div>

        <button type="submit" className="btn-primary flex items-center justify-center gap-1.5" disabled={saving}>
          {saved && <CheckCircleIcon filled className="h-4 w-4" />}
          {saving ? "Menyimpan..." : saved ? "Disimpan" : "Simpan Tetapan"}
        </button>
      </form>
    </div>
  );
}
