"use client";

import { useState } from "react";
import AreaPicker from "@/components/AreaPicker";
import { fileToCompressedDataUrl } from "@/lib/image";
import { CameraIcon, CheckCircleIcon, LinkIcon, CopyIcon, SendIcon, LockIcon, ChevronLeftIcon, ImageOffIcon, InstagramIcon, TiktokIcon, ThreadsIcon, SocialXIcon, PlusIcon, XIcon, ClockIcon, StarIcon, UserIcon, MapPinIcon, WalletIcon } from "@/components/icons";

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
    depositRequired: boolean;
    depositAmount: string | null;
    paymentMethod: "QR" | "CASH" | null;
    qrCodeUrl: string | null;
    extraChargesNote: string | null;
    socialInstagram: string | null;
    socialTiktok: string | null;
    socialThreads: string | null;
    socialX: string | null;
    specialties: string[];
    yearsExperience: number | null;
    workingHoursNote: string | null;
    galleryPhotos: string[];
  };
};

const POLICY_LABEL: Record<string, string> = {
  FEMALE_ONLY: "Wanita sahaja",
  MALE_ONLY: "Lelaki sahaja",
  BOTH: "Lelaki & Wanita",
};

export default function ProfileForm({ token, slug, therapist }: Props) {
  const [form, setForm] = useState({
    ...therapist,
    username: therapist.username ?? "",
    depositAmount: therapist.depositAmount ?? "",
    paymentMethod: therapist.paymentMethod ?? "QR",
    extraChargesNote: therapist.extraChargesNote ?? "",
    socialInstagram: therapist.socialInstagram ?? "",
    socialTiktok: therapist.socialTiktok ?? "",
    socialThreads: therapist.socialThreads ?? "",
    socialX: therapist.socialX ?? "",
    yearsExperience: therapist.yearsExperience?.toString() ?? "",
    workingHoursNote: therapist.workingHoursNote ?? "",
  });
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [editingCreds, setEditingCreds] = useState(false);

  // Collapsed-by-default sections: cleaner UI, less scrolling. Tap "Edit" to expand.
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAreas, setEditingAreas] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState(false);
  const [editingSocial, setEditingSocial] = useState(false);
  const [editingSpecialties, setEditingSpecialties] = useState(false);

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

  async function handleQrPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, { maxWidth: 700, maxHeight: 700, quality: 0.85 });
      setForm((f) => ({ ...f, qrCodeUrl: dataUrl }));
    } finally {
      setUploadingQr(false);
    }
  }

  function addSpecialty() {
    const value = specialtyInput.trim();
    if (!value || form.specialties.includes(value) || form.specialties.length >= 8) {
      setSpecialtyInput("");
      return;
    }
    setForm((f) => ({ ...f, specialties: [...f.specialties, value] }));
    setSpecialtyInput("");
  }

  function removeSpecialty(tag: string) {
    setForm((f) => ({ ...f, specialties: f.specialties.filter((t) => t !== tag) }));
  }

  async function handleGalleryPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || form.galleryPhotos.length >= 6) return;
    setUploadingGallery(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, { maxWidth: 900, maxHeight: 900 });
      setForm((f) => ({ ...f, galleryPhotos: [...f.galleryPhotos, dataUrl] }));
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  }

  function removeGalleryPhoto(index: number) {
    setForm((f) => ({ ...f, galleryPhotos: f.galleryPhotos.filter((_, i) => i !== index) }));
  }

  function toggleArea(a: string) {
    setForm((f) => ({
      ...f,
      coverageAreas: f.coverageAreas.includes(a) ? f.coverageAreas.filter((x) => x !== a) : [...f.coverageAreas, a],
    }));
  }

  function cancelProfileEdit() {
    setForm((f) => ({
      ...f,
      photoUrl: therapist.photoUrl,
      name: therapist.name,
      phone: therapist.phone,
      clientGenderPolicy: therapist.clientGenderPolicy,
      bio: therapist.bio,
    }));
    setEditingProfile(false);
  }

  function cancelAreasEdit() {
    setForm((f) => ({ ...f, coverageAreas: therapist.coverageAreas }));
    setEditingAreas(false);
  }

  function cancelDepositEdit() {
    setForm((f) => ({
      ...f,
      depositRequired: therapist.depositRequired,
      depositAmount: therapist.depositAmount ?? "",
      paymentMethod: therapist.paymentMethod ?? "QR",
      qrCodeUrl: therapist.qrCodeUrl,
      extraChargesNote: therapist.extraChargesNote ?? "",
    }));
    setEditingDeposit(false);
  }

  function cancelSocialEdit() {
    setForm((f) => ({
      ...f,
      socialInstagram: therapist.socialInstagram ?? "",
      socialTiktok: therapist.socialTiktok ?? "",
      socialThreads: therapist.socialThreads ?? "",
      socialX: therapist.socialX ?? "",
    }));
    setEditingSocial(false);
  }

  function cancelSpecialtiesEdit() {
    setForm((f) => ({
      ...f,
      specialties: therapist.specialties,
      yearsExperience: therapist.yearsExperience?.toString() ?? "",
      workingHoursNote: therapist.workingHoursNote ?? "",
    }));
    setSpecialtyInput("");
    setEditingSpecialties(false);
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
    body.depositAmount = form.depositAmount === "" ? null : Number(form.depositAmount);
    if (!form.depositRequired) {
      body.paymentMethod = null;
    }
    body.yearsExperience = form.yearsExperience === "" ? null : Number(form.yearsExperience);

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
      setEditingProfile(false);
      setEditingAreas(false);
      setEditingDeposit(false);
      setEditingSocial(false);
      setEditingSpecialties(false);
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

  const hasSocial = Boolean(form.socialInstagram || form.socialTiktok || form.socialThreads || form.socialX);

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
      {/* Profil Asas — collapsed by default; tap the card itself to edit */}
      {editingProfile ? (
        <div className="rounded-2xl bg-brand-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-900">
              <UserIcon className="h-4 w-4" />
              Profil Asas
            </p>
            <button type="button" onClick={cancelProfileEdit} className="text-xs font-semibold text-gray-400">
              Batal
            </button>
          </div>
          <div className="flex flex-col gap-3">
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

            <textarea className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Ringkasan" rows={3} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingProfile(true)}
          className="card-tap flex w-full items-center justify-between gap-3 rounded-2xl bg-brand-50/60 p-4 text-left"
        >
          <div className="flex min-w-0 items-center gap-3">
            {form.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.photoUrl} alt="Profil" className="avatar-ring h-11 w-11 shrink-0 rounded-2xl object-cover" />
            ) : (
              <div className="avatar-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                {form.name.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-900">{form.name || "Belum ditetapkan"}</p>
              <p className="truncate text-xs text-gray-500">
                {form.phone || "No. telefon belum ditetapkan"} &middot; {POLICY_LABEL[form.clientGenderPolicy]}
              </p>
            </div>
          </div>
          <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0 rotate-180 text-brand-300" />
        </button>
      )}

      {/* Kawasan Liputan — collapsed by default; tap the card itself to edit */}
      {editingAreas ? (
        <div className="rounded-2xl bg-brand-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-900">
              <MapPinIcon className="h-4 w-4" />
              Kawasan Liputan
            </p>
            <button type="button" onClick={cancelAreasEdit} className="text-xs font-semibold text-gray-400">
              Batal
            </button>
          </div>
          <AreaPicker value={form.coverageAreas} onToggle={toggleArea} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingAreas(true)}
          className="card-tap flex w-full items-start justify-between gap-3 rounded-2xl bg-brand-50/60 p-4 text-left"
        >
          <div className="min-w-0">
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-brand-900">
              <MapPinIcon className="h-4 w-4" />
              Kawasan Liputan
            </p>
            {form.coverageAreas.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {form.coverageAreas.map((a) => (
                  <span key={a} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-brand-600">
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Belum pilih kawasan</p>
            )}
          </div>
          <ChevronLeftIcon className="mt-1 h-3.5 w-3.5 shrink-0 rotate-180 text-brand-300" />
        </button>
      )}

      {/* Kepakaran & Pengalaman — collapsed by default; tap the card itself to edit */}
      {editingSpecialties ? (
        <div className="rounded-2xl bg-brand-50/60 p-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-900">
              <StarIcon className="h-4 w-4" />
              Kepakaran &amp; Pengalaman
            </p>
            <button type="button" onClick={cancelSpecialtiesEdit} className="text-xs font-semibold text-gray-400">
              Batal
            </button>
          </div>
          <p className="mb-3 text-xs text-gray-500">Tag kepakaran membantu pelanggan cepat nampak kelebihan anda.</p>

          <div className="mb-3 flex flex-wrap gap-2">
            {form.specialties.map((tag) => (
              <span key={tag} className="chip chip-active flex items-center gap-1 pr-1.5">
                {tag}
                <button type="button" onClick={() => removeSpecialty(tag)} className="flex h-4 w-4 items-center justify-center rounded-full bg-white/60">
                  <XIcon className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="mb-3 flex gap-2">
            <input
              className="input"
              placeholder="cth: Deep Tissue, Prenatal"
              value={specialtyInput}
              onChange={(e) => setSpecialtyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSpecialty();
                }
              }}
            />
            <button type="button" onClick={addSpecialty} className="btn-secondary shrink-0 px-4">
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-3">
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Tahun pengalaman"
              value={form.yearsExperience}
              onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })}
            />
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3">
            <ClockIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              className="w-full bg-transparent py-2.5 text-[15px] placeholder:text-gray-400 focus:outline-none"
              placeholder="Waktu beroperasi, cth: Isnin-Jumaat 9am-8pm"
              value={form.workingHoursNote}
              onChange={(e) => setForm({ ...form, workingHoursNote: e.target.value })}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingSpecialties(true)}
          className="card-tap flex w-full items-start justify-between gap-3 rounded-2xl bg-brand-50/60 p-4 text-left"
        >
          <div className="min-w-0">
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-brand-900">
              <StarIcon className="h-4 w-4" />
              Kepakaran &amp; Pengalaman
            </p>
            {form.specialties.length > 0 ? (
              <div className="mb-1.5 flex flex-wrap gap-1.5">
                {form.specialties.map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-brand-600">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Belum ada kepakaran</p>
            )}
            {(form.yearsExperience || form.workingHoursNote) && (
              <p className="text-xs text-gray-400">
                {form.yearsExperience && `${form.yearsExperience} tahun pengalaman`}
                {form.yearsExperience && form.workingHoursNote && " · "}
                {form.workingHoursNote}
              </p>
            )}
          </div>
          <ChevronLeftIcon className="mt-1 h-3.5 w-3.5 shrink-0 rotate-180 text-brand-300" />
        </button>
      )}

      <div className="rounded-2xl bg-brand-50/60 p-4">
        <p className="mb-1 text-[15px] font-bold text-brand-900">Galeri Foto</p>
        <p className="mb-3 text-xs text-gray-500">Tambah sehingga 6 foto (tempat kerja, suasana, dll) untuk pelanggan lihat.</p>
        <div className="flex flex-wrap gap-2.5">
          {form.galleryPhotos.map((url, i) => (
            <div key={i} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Galeri ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeGalleryPhoto(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          {form.galleryPhotos.length < 6 && (
            <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand-200 bg-white text-brand-400">
              <CameraIcon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{uploadingGallery ? "..." : "Tambah"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleGalleryPhoto} disabled={uploadingGallery} />
            </label>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2.5 rounded-2xl bg-brand-50/60 px-4 py-3 text-sm font-medium text-gray-600">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-brand-600" />
        Profil aktif (kelihatan kepada pelanggan)
      </label>

      {editingCreds ? (
        <div className="rounded-2xl bg-brand-50/60 p-4">
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
                placeholder="PIN baru (optional)"
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
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingCreds(true)}
          className="card-tap flex w-full items-center justify-between gap-3 rounded-2xl bg-brand-50/60 p-4 text-left"
        >
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
          <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0 rotate-180 text-brand-300" />
        </button>
      )}

      {/* Bayaran & Deposit — collapsed by default; tap the card itself to edit */}
      {editingDeposit ? (
        <div className="rounded-2xl bg-brand-50/60 p-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[15px] font-bold text-brand-900">
              <WalletIcon className="h-4 w-4" />
              Bayaran &amp; Deposit
            </p>
            <button type="button" onClick={cancelDepositEdit} className="text-xs font-semibold text-gray-400">
              Batal
            </button>
          </div>
          <p className="mb-3 text-xs text-gray-500">Tetapkan jika anda perlukan deposit sebelum tempahan disahkan, dan caj tambahan (jika ada).</p>

          <label className="mb-3 flex items-center justify-between rounded-xl bg-white px-4 py-3">
            <span className="text-sm font-medium text-gray-700">Perlukan deposit?</span>
            <input
              type="checkbox"
              checked={form.depositRequired}
              onChange={(e) => setForm({ ...form, depositRequired: e.target.checked })}
              className="h-4 w-4 accent-brand-600"
            />
          </label>

          {form.depositRequired && (
            <div className="mb-3 flex flex-col gap-3 animate-fade-in">
              <input
                className="input"
                type="number"
                min="0"
                placeholder="Jumlah deposit (RM)"
                value={form.depositAmount}
                onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-900">Kaedah bayaran</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: "QR" })}
                    className={`chip justify-center py-2.5 ${form.paymentMethod === "QR" ? "chip-active" : ""}`}
                  >
                    QR (disyorkan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: "CASH" })}
                    className={`chip justify-center py-2.5 ${form.paymentMethod === "CASH" ? "chip-active" : ""}`}
                  >
                    Tunai
                  </button>
                </div>
              </div>

              {form.paymentMethod === "QR" && (
                <div className="animate-fade-in">
                  <label className="mb-2 block text-sm font-semibold text-brand-900">Kod QR</label>
                  <div className="flex items-center gap-3">
                    {form.qrCodeUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.qrCodeUrl} alt="Kod QR" className="h-20 w-20 rounded-xl border border-black/[0.06] object-cover" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white text-brand-300">
                        <ImageOffIcon className="h-6 w-6" />
                      </div>
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand-600">
                      <CameraIcon className="h-4 w-4" />
                      {uploadingQr ? "Memuat naik..." : form.qrCodeUrl ? "Tukar kod QR" : "Muat naik kod QR"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleQrPhoto} disabled={uploadingQr} />
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">Kod QR ini akan ditunjukkan kepada pelanggan semasa tempahan.</p>
                </div>
              )}
            </div>
          )}

          <textarea
            className="input"
            placeholder="Caj tambahan, cth: RM10 minyak/tol/parking (optional)"
            value={form.extraChargesNote}
            onChange={(e) => setForm({ ...form, extraChargesNote: e.target.value })}
            rows={2}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingDeposit(true)}
          className="card-tap flex w-full items-start justify-between gap-3 rounded-2xl bg-brand-50/60 p-4 text-left"
        >
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-brand-900">
              <WalletIcon className="h-4 w-4" />
              Bayaran &amp; Deposit
            </p>
            <p className="text-xs text-gray-500">
              {form.depositRequired && form.depositAmount
                ? `Deposit RM${form.depositAmount} · ${form.paymentMethod === "CASH" ? "Tunai" : "QR"}`
                : "Tiada deposit diperlukan"}
            </p>
            {form.extraChargesNote && (
              <p className="mt-1 truncate text-xs text-gray-400">Caj tambahan: {form.extraChargesNote}</p>
            )}
          </div>
          <ChevronLeftIcon className="mt-1 h-3.5 w-3.5 shrink-0 rotate-180 text-brand-300" />
        </button>
      )}

      {/* Media Sosial — collapsed by default; tap the card itself to edit */}
      {editingSocial ? (
        <div className="rounded-2xl bg-brand-50/60 p-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[15px] font-bold text-brand-900">Media Sosial</p>
            <button type="button" onClick={cancelSocialEdit} className="text-xs font-semibold text-gray-400">
              Batal
            </button>
          </div>
          <p className="mb-3 text-xs text-gray-500">Opsyenal. Bantu pelanggan buat semakan sendiri (due diligence) tentang anda selain ulasan SpaGo.</p>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3">
              <InstagramIcon className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                className="w-full bg-transparent py-2.5 text-[15px] placeholder:text-gray-400 focus:outline-none"
                placeholder="Instagram (@username)"
                value={form.socialInstagram}
                onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3">
              <TiktokIcon className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                className="w-full bg-transparent py-2.5 text-[15px] placeholder:text-gray-400 focus:outline-none"
                placeholder="TikTok (@username)"
                value={form.socialTiktok}
                onChange={(e) => setForm({ ...form, socialTiktok: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3">
              <ThreadsIcon className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                className="w-full bg-transparent py-2.5 text-[15px] placeholder:text-gray-400 focus:outline-none"
                placeholder="Threads (@username)"
                value={form.socialThreads}
                onChange={(e) => setForm({ ...form, socialThreads: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3">
              <SocialXIcon className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                className="w-full bg-transparent py-2.5 text-[15px] placeholder:text-gray-400 focus:outline-none"
                placeholder="X / Twitter (@username)"
                value={form.socialX}
                onChange={(e) => setForm({ ...form, socialX: e.target.value })}
              />
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingSocial(true)}
          className="card-tap flex w-full items-center justify-between gap-3 rounded-2xl bg-brand-50/60 p-4 text-left"
        >
          <div className="min-w-0">
            <p className="mb-1.5 text-sm font-semibold text-brand-900">Media Sosial</p>
            {hasSocial ? (
              <div className="flex items-center gap-2 text-brand-500">
                {form.socialInstagram && <InstagramIcon className="h-4 w-4" />}
                {form.socialTiktok && <TiktokIcon className="h-4 w-4" />}
                {form.socialThreads && <ThreadsIcon className="h-4 w-4" />}
                {form.socialX && <SocialXIcon className="h-4 w-4" />}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Belum ditetapkan</p>
            )}
          </div>
          <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0 rotate-180 text-brand-300" />
        </button>
      )}

      <button type="submit" className="btn-primary flex items-center justify-center gap-1.5" disabled={saving}>
        {saved && <CheckCircleIcon filled className="h-4 w-4" />}
        {saving ? "Menyimpan..." : saved ? "Disimpan" : "Simpan"}
      </button>
      </form>
    </div>
  );
}
