"use client";

import { useState } from "react";
import { AREAS } from "@/lib/areas";
import { fileToCompressedDataUrl } from "@/lib/image";
import { CameraIcon, CheckCircleIcon, LinkIcon, CopyIcon, SendIcon, LockIcon, ChevronLeftIcon } from "@/components/icons";

type Props = {
  token: string;
  slug: string | null;
  therapist: {
    name: string;
    phone: string;
    gender: "MALE" | "FEMALE";
    clientGenderPolicy: "FEMALE_ONLY" | "MALE_ONLY" | "BOTH";
    coverageAreas: string[];
    bio: string;
    active: boolean;
    photoUrl: string | null;
    username: string | null;
  };
};

export default function ProfileForm({ token, slug, therapist }: Props) {
  const [form, setForm] = useState({ ...therapist, username: therapist.username ?? "" });
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [copied, setCopied] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [editingCreds, setEditingCreds] = useState(false);

  const promoUrl = slug
    ? typeof window !== "undefined"
      ? `${window.location.origin}/t/${slug}`
      : `/t/${slug}`
    : null;

  async function handleCopy() {
    if (!promoUrl) return;
    try {
      await navigator.clipboard.writeText(promoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable; user can select the text manually
    }
  }

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
    setCredError(null);

    if (form.username && !/^[a-zA-Z0-9_]{4,20}$/.test(form.username)) {
      setCredError("Username mesti 4-20 aksara (huruf, nombor, garis bawah sahaja).");
      return;
    }
    if (newPin || newPinConfirm) {
      if (!/^[0-9]{4,6}$/.test(newPin)) {
        setCredError("PIN mesti 4-6 digit nombor sahaja.");
        return;
      }
      if (newPin !== newPinConfirm) {
        setCredError("PIN baru tidak sepadan.");
        return;
      }
    }

    setSaving(true);
    setSaved(false);
    const body: Record<string, unknown> = { ...form };
    if (!form.username) delete body.username;
    if (newPin) body.pin = newPin;

    const res = await fetch(`/api/dashboard/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setNewPin("");
      setNewPinConfirm("");
      setEditingCreds(false);
      setTimeout(() => setSaved(false), 2000);
    } else {
      const data = await res.json().catch(() => null);
      setCredError(
        data?.error === "USERNAME_TAKEN"
          ? "Username ini sudah digunakan."
          : data?.error === "USERNAME_INVALID"
            ? "Username mesti 4-20 aksara (huruf, nombor, garis bawah sahaja)."
            : data?.error === "PIN_INVALID"
              ? "PIN mesti 4-6 digit nombor sahaja."
              : "Gagal menyimpan. Sila cuba lagi."
      );
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-brand-50/60 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-brand-900">
          <LinkIcon className="h-4 w-4" />
          Pautan promosi anda
        </p>
        {promoUrl ? (
          <>
            <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3 py-2.5">
              <span className="flex-1 truncate text-[13px] text-gray-600">{promoUrl}</span>
              <button type="button" onClick={handleCopy} className="btn-ghost shrink-0 bg-brand-50 px-2.5 py-1.5 text-xs">
                <CopyIcon className="h-3.5 w-3.5" />
                {copied ? "Disalin!" : "Salin"}
              </button>
            </div>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Tempah urut dengan saya di sini: ${promoUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600"
            >
              <SendIcon className="h-3 w-3" />
              Kongsi ke WhatsApp
            </a>
          </>
        ) : (
          <p className="text-[13px] text-gray-400">Pautan sedang dijana, sila muat semula sebentar lagi.</p>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        {form.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.photoUrl} alt="Profil" className="avatar-ring h-20 w-20 rounded-3xl object-cover" />
        ) : (
          <div className="avatar-ring flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-bold text-white">
            {form.name.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand-600">
          <CameraIcon className="h-4 w-4" />
          {uploadingPhoto ? "Memuat naik..." : "Tukar foto profil"}
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploadingPhoto} />
        </label>
      </div>

      <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama" />
      <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="No. WhatsApp" />

      <div>
        <label className="mb-2 block text-sm font-semibold text-brand-900">Pelanggan yang diterima</label>
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
        <label className="mb-2 block text-sm font-semibold text-brand-900">Kawasan liputan</label>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => toggleArea(a)}
              className={`chip ${form.coverageAreas.includes(a) ? "chip-active" : ""}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <textarea className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Ringkasan" rows={3} />

      <label className="flex items-center gap-2.5 rounded-2xl bg-brand-50/60 px-4 py-3 text-sm font-medium text-gray-600">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-brand-600" />
        Profil aktif (kelihatan kepada pelanggan)
      </label>

      <div className="rounded-2xl bg-brand-50/60 p-4">
        {editingCreds ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-900">
                <LockIcon className="h-4 w-4" />
                Log masuk
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingCreds(false);
                  setCredError(null);
                  setNewPin("");
                  setNewPinConfirm("");
                  setForm((f) => ({ ...f, username: therapist.username ?? "" }));
                }}
                className="text-xs font-semibold text-gray-400"
              >
                Batal
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <input
                className="input"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.trim() })}
                autoCapitalize="none"
              />
              <div className="flex gap-3">
                <input
                  className="input"
                  type="password"
                  inputMode="numeric"
                  placeholder="PIN baru (opsyenal)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <input
                  className="input"
                  type="password"
                  inputMode="numeric"
                  placeholder="Sahkan PIN baru"
                  value={newPinConfirm}
                  onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">Kosongkan PIN jika tidak mahu menukarnya. Simpan guna butang di bawah.</p>
            {credError && <p className="mt-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{credError}</p>}
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-900">
                <LockIcon className="h-4 w-4" />
                Log masuk
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {therapist.username ? (
                  <>Username: <span className="font-medium text-gray-600">{therapist.username}</span></>
                ) : (
                  "Belum ditetapkan"
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingCreds(true)}
              className="btn-ghost flex items-center gap-1 bg-white px-3 py-1.5 text-xs"
            >
              {therapist.username ? "Tukar" : "Tetapkan"}
              <ChevronLeftIcon className="h-3 w-3 rotate-180" />
            </button>
          </div>
        )}
      </div>

      <button type="submit" className="btn-primary flex items-center justify-center gap-1.5" disabled={saving}>
        {saved && <CheckCircleIcon filled className="h-4 w-4" />}
        {saving ? "Menyimpan..." : saved ? "Disimpan" : "Simpan"}
      </button>
      </form>
    </div>
  );
}
