"use client";

import { useState } from "react";
import { AREAS } from "@/lib/areas";
import { fileToCompressedDataUrl } from "@/lib/image";

type Props = {
  token: string;
  therapist: {
    name: string;
    phone: string;
    gender: "MALE" | "FEMALE";
    clientGenderPolicy: "FEMALE_ONLY" | "MALE_ONLY" | "BOTH";
    coverageAreas: string[];
    bio: string;
    active: boolean;
    photoUrl: string | null;
  };
};

export default function ProfileForm({ token, therapist }: Props) {
  const [form, setForm] = useState(therapist);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, { maxWidth: 500, maxHeight: 500 });
      setForm((f) => ({ ...f, photoUrl: dataUrl }));
    } finally {
      setUploadingPhoto(false);
    }
  }

  function toggleArea(a: string) {
    setForm((f) => ({
      ...f,
      coverageAreas: f.coverageAreas.includes(a) ? f.coverageAreas.filter((x) => x !== a) : [...f.coverageAreas, a],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch(`/api/dashboard/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {form.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.photoUrl} alt="Profil" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
            {form.name.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <label className="cursor-pointer text-sm font-medium text-brand-600">
          {uploadingPhoto ? "Memuat naik..." : "Tukar foto profil"}
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploadingPhoto} />
        </label>
      </div>

      <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama" />
      <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="No. WhatsApp" />

      <div>
        <label className="mb-2 block text-sm font-medium text-brand-900">Pelanggan yang diterima</label>
        <select
          className="input"
          value={form.clientGenderPolicy}
          onChange={(e) => setForm({ ...form, clientGenderPolicy: e.target.value as any })}
        >
          <option value="FEMALE_ONLY">Wanita sahaja</option>
          <option value="MALE_ONLY">Lelaki sahaja</option>
          <option value="BOTH">Lelaki & Wanita</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-brand-900">Kawasan liputan</label>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => toggleArea(a)}
              className={`rounded-full border px-3 py-1.5 text-sm ${form.coverageAreas.includes(a) ? "border-brand-600 bg-brand-50 text-brand-700" : "border-black/10 bg-white text-gray-600"}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <textarea className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Ringkasan" rows={3} />

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        Profil aktif (kelihatan kepada pelanggan)
      </label>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Menyimpan..." : saved ? "Disimpan ✓" : "Simpan"}
      </button>
    </form>
  );
}
