"use client";

import { useState } from "react";
import { PaletteIcon, CheckCircleIcon, LogOutIcon, CameraIcon, XIcon } from "@/components/icons";
import { fileToCompressedDataUrl } from "@/lib/image";

export default function AdminSettingsForm({
  initialThemeColor,
  initialBackgroundColor,
  initialHeroTitle,
  initialHeroSubtitle,
  initialHeroBackgroundImage,
}: {
  initialThemeColor: string;
  initialBackgroundColor: string;
  initialHeroTitle: string;
  initialHeroSubtitle: string;
  initialHeroBackgroundImage: string | null;
}) {
  const [themeColor, setThemeColor] = useState(initialThemeColor);
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [heroTitle, setHeroTitle] = useState(initialHeroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(initialHeroSubtitle);
  const [heroBackgroundImage, setHeroBackgroundImage] = useState<string | null>(initialHeroBackgroundImage);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleHeroImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, { maxWidth: 1200, maxHeight: 900, quality: 0.75 });
      setHeroBackgroundImage(dataUrl);
    } finally {
      setUploadingHero(false);
      e.target.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeColor, backgroundColor, heroTitle, heroSubtitle, heroBackgroundImage }),
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

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="card flex flex-col gap-5">
          <p className="text-[15px] font-bold text-brand-900">Seksyen Hero (homepage)</p>

          <div>
            <label className="mb-2 block text-sm font-semibold text-brand-900">Gambar latar belakang</label>
            {heroBackgroundImage ? (
              <div className="relative overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroBackgroundImage} alt="Hero" className="h-32 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setHeroBackgroundImage(null)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white active:scale-90"
                  aria-label="Buang gambar"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                className="flex h-24 w-full items-center justify-center rounded-2xl text-white"
                style={{ background: `linear-gradient(135deg, ${themeColor}, color-mix(in srgb, ${themeColor} 55%, white))` }}
              >
                <span className="text-xs font-medium text-white/80">Tiada gambar — guna warna tema</span>
              </div>
            )}
            <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand-600">
              <CameraIcon className="h-4 w-4" />
              {uploadingHero ? "Memuat naik..." : heroBackgroundImage ? "Tukar gambar" : "Muat naik gambar"}
              <input type="file" accept="image/*" className="hidden" onChange={handleHeroImage} disabled={uploadingHero} />
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-brand-900">Tajuk utama</label>
            <input className="input" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} maxLength={120} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-brand-900">Sub-tajuk</label>
            <textarea className="input" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={3} maxLength={300} />
          </div>
        </div>

        <div className="card flex flex-col gap-5">
          <p className="text-[15px] font-bold text-brand-900">Warna</p>

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
            <p className="mt-1.5 text-xs text-gray-400">Digunakan pada butang utama, nav aktif dan hero (jika tiada gambar).</p>
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
        </div>

        <button type="submit" className="btn-primary flex items-center justify-center gap-1.5" disabled={saving}>
          {saved && <CheckCircleIcon filled className="h-4 w-4" />}
          {saving ? "Menyimpan..." : saved ? "Disimpan" : "Simpan Tetapan"}
        </button>
      </form>
    </div>
  );
}
