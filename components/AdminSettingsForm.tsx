"use client";

import { useMemo, useState } from "react";
import { PaletteIcon, CheckCircleIcon, CameraIcon, XIcon, MailIcon, AlertTriangleIcon } from "@/components/icons";
import { fileToCompressedDataUrl } from "@/lib/image";

// Body text color (--text-primary) is a fixed near-white and never adapts
// to the admin-chosen background — so a light "Warna latar belakang" pick
// can make all body text on the site nearly invisible. This computes the
// real WCAG contrast between the chosen background and that fixed text
// color so we can warn (or block) before that ships.
const TEXT_PRIMARY_HEX = "#f5f2fb";

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function relativeLuminance([r, g, b]: [number, number, number]) {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hexA: string, hexB: string): number | null {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  const [l1, l2] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export default function AdminSettingsForm({
  initialThemeColor,
  initialBackgroundColor,
  initialHeroTitle,
  initialHeroSubtitle,
  initialHeroBackgroundImage,
  initialAdminEmail,
}: {
  initialThemeColor: string;
  initialBackgroundColor: string;
  initialHeroTitle: string;
  initialHeroSubtitle: string;
  initialHeroBackgroundImage: string | null;
  initialAdminEmail: string | null;
}) {
  const [themeColor, setThemeColor] = useState(initialThemeColor);
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [heroTitle, setHeroTitle] = useState(initialHeroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(initialHeroSubtitle);
  const [heroBackgroundImage, setHeroBackgroundImage] = useState<string | null>(initialHeroBackgroundImage);
  const [adminEmail, setAdminEmail] = useState(initialAdminEmail ?? "");
  const [uploadingHero, setUploadingHero] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const bgContrast = useMemo(() => contrastRatio(backgroundColor, TEXT_PRIMARY_HEX), [backgroundColor]);
  const bgContrastBroken = bgContrast !== null && bgContrast < 2;
  const bgContrastLow = bgContrast !== null && bgContrast >= 2 && bgContrast < 4.5;

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
      body: JSON.stringify({ themeColor, backgroundColor, heroTitle, heroSubtitle, heroBackgroundImage, adminEmail }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--surface-2)] text-brand-300">
          <PaletteIcon className="h-5 w-5" />
        </div>
        <h1 className="text-lg font-bold text-[color:var(--text-primary)]">Tetapan Laman</h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="card flex flex-col gap-5">
          <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Seksyen Hero (homepage)</p>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[color:var(--text-primary)]">Gambar latar belakang</label>
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
            <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand-300">
              <CameraIcon className="h-4 w-4" />
              {uploadingHero ? "Memuat naik..." : heroBackgroundImage ? "Tukar gambar" : "Muat naik gambar"}
              <input type="file" accept="image/*" className="hidden" onChange={handleHeroImage} disabled={uploadingHero} />
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[color:var(--text-primary)]">Tajuk utama</label>
            <input className="input" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} maxLength={120} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[color:var(--text-primary)]">Sub-tajuk</label>
            <textarea className="input" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={3} maxLength={300} />
          </div>
        </div>

        <div className="card flex flex-col gap-5">
          <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Warna</p>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[color:var(--text-primary)]">Warna tema</label>
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
            <p className="mt-1.5 text-xs text-[color:var(--text-muted)]">Digunakan pada butang utama, nav aktif dan hero (jika tiada gambar).</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[color:var(--text-primary)]">Warna latar belakang</label>
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
            {(bgContrastBroken || bgContrastLow) && (
              <p
                className={`mt-2 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium ${
                  bgContrastBroken ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
                }`}
              >
                <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {bgContrastBroken
                  ? "Warna ini terlalu terang — teks laman akan hampir tidak kelihatan di atas latar belakang ini. Sila pilih warna yang lebih gelap."
                  : "Warna ini agak terang. Teks pada laman mungkin sukar dibaca oleh sesetengah pengguna."}
              </p>
            )}
            <p className="mt-1.5 text-xs text-[color:var(--text-muted)]">
              Teks laman (putih/lavender terang) tidak berubah mengikut warna ini — elakkan warna terang supaya teks kekal jelas dibaca.
            </p>
          </div>
        </div>

        <div className="card flex flex-col gap-3">
          <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Notifikasi</p>
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[color:var(--text-primary)]">
              <MailIcon className="h-4 w-4 text-brand-500" />
              Email admin
            </label>
            <input
              className="input"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@contoh.com"
            />
            <p className="mt-1.5 text-xs text-[color:var(--text-muted)]">
              Email akan dihantar ke sini setiap kali ada terapis baru daftar melalui Daftar Terapis.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary flex items-center justify-center gap-1.5"
          disabled={saving || bgContrastBroken}
          title={bgContrastBroken ? "Betulkan warna latar belakang dahulu — teks tidak akan kelihatan" : undefined}
        >
          {saved && <CheckCircleIcon filled className="h-4 w-4" />}
          {saving ? "Menyimpan..." : saved ? "Disimpan" : bgContrastBroken ? "Betulkan warna dahulu" : "Simpan Tetapan"}
        </button>
      </form>
    </div>
  );
}
