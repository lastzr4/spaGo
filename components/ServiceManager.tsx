"use client";

import { useRef, useState } from "react";
import { fileToCompressedDataUrl, fileToDataUrl } from "@/lib/image";
import { CameraIcon, PlusIcon, TrashIcon, SparkleIcon, FileUpIcon, EyeIcon } from "@/components/icons";
import ServiceDetailSheet from "@/components/ServiceDetailSheet";
import ServiceBadgeRibbon from "@/components/ServiceBadgeRibbon";
import { SERVICE_BADGES, BADGE_LABELS, ServiceBadge, hasPromo } from "@/lib/pricing";

const fieldLabelClass = "mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]";
const fieldInputClass =
  "w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-2)] px-3 py-1.5 text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-brand-400";

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: string;
  active: boolean;
  photoUrl?: string | null;
  description?: string | null;
  promoPrice?: string | null;
  badge?: string | null;
};

export default function ServiceManager({
  token,
  initialServices,
  depositRequired = false,
  depositAmount = null,
  paymentMethod = null,
}: {
  token: string;
  initialServices: Service[];
  depositRequired?: boolean;
  depositAmount?: string | null;
  paymentMethod?: "QR" | "CASH" | null;
}) {
  const [services, setServices] = useState(initialServices);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [badge, setBadge] = useState<ServiceBadge | null>(null);
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPromoPrice, setEditPromoPrice] = useState("");
  const [editBadge, setEditBadge] = useState<ServiceBadge | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccess, setExtractSuccess] = useState<string | null>(null);
  const [previewService, setPreviewService] = useState<Service | null>(null);
  const newPhotoInputRef = useRef<HTMLInputElement>(null);
  const extractInputRef = useRef<HTMLInputElement>(null);

  function startEdit(service: Service) {
    setEditingId(service.id);
    setEditName(service.name);
    setEditDuration(String(service.durationMinutes));
    setEditPrice(service.price);
    setEditPromoPrice(service.promoPrice ?? "");
    setEditBadge(SERVICE_BADGES.includes(service.badge as ServiceBadge) ? (service.badge as ServiceBadge) : null);
    setEditDescription(service.description ?? "");
    setEditError(null);
  }

  async function saveEdit(service: Service) {
    if (!editName.trim() || !editDuration || !editPrice) return;
    setSavingEdit(true);
    setEditError(null);
    const res = await fetch(`/api/dashboard/${token}/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        durationMinutes: Number(editDuration),
        price: Number(editPrice),
        promoPrice: editPromoPrice.trim() ? Number(editPromoPrice) : null,
        badge: editBadge,
        description: editDescription.trim() || null,
      }),
    });
    if (res.ok) {
      setServices((list) =>
        list.map((s) =>
          s.id === service.id
            ? {
                ...s,
                name: editName.trim(),
                durationMinutes: Number(editDuration),
                price: editPrice,
                promoPrice: editPromoPrice.trim() ? editPromoPrice : null,
                badge: editBadge,
                description: editDescription.trim() || null,
              }
            : s
        )
      );
      setEditingId(null);
    } else {
      const data = await res.json().catch(() => null);
      setEditError(
        data?.error === "PROMO_PRICE_INVALID"
          ? "Harga promo mesti kurang daripada harga asal."
          : "Gagal menyimpan. Sila cuba lagi."
      );
    }
    setSavingEdit(false);
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !duration || !price) return;
    setAdding(true);
    setAddError(null);
    const res = await fetch(`/api/dashboard/${token}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        durationMinutes: Number(duration),
        price: Number(price),
        promoPrice: promoPrice.trim() ? Number(promoPrice) : null,
        badge,
        description: description.trim() || null,
        photoUrl,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setServices((s) => [...s, data.service]);
      setName("");
      setDuration("60");
      setPrice("");
      setPromoPrice("");
      setBadge(null);
      setDescription("");
      setPhotoUrl(null);
      if (newPhotoInputRef.current) newPhotoInputRef.current.value = "";
    } else {
      setAddError(
        data?.error === "PROMO_PRICE_INVALID"
          ? "Harga promo mesti kurang daripada harga asal."
          : "Gagal menambah servis. Sila cuba lagi."
      );
    }
    setAdding(false);
  }

  async function toggleActive(service: Service) {
    const res = await fetch(`/api/dashboard/${token}/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !service.active }),
    });
    if (res.ok) {
      setServices((list) => list.map((s) => (s.id === service.id ? { ...s, active: !s.active } : s)));
    }
  }

  async function removeService(id: string) {
    const res = await fetch(`/api/dashboard/${token}/services/${id}`, { method: "DELETE" });
    if (res.ok) setServices((list) => list.filter((s) => s.id !== id));
  }

  async function handleNewPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPhotoUrl(dataUrl);
    } catch {
      // ignore, user can retry
    }
  }

  async function handleExistingPhoto(service: Service, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFor(service.id);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      const res = await fetch(`/api/dashboard/${token}/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: dataUrl }),
      });
      if (res.ok) {
        setServices((list) => list.map((s) => (s.id === service.id ? { ...s, photoUrl: dataUrl } : s)));
      }
    } finally {
      setUploadingFor(null);
      e.target.value = "";
    }
  }

  async function handleExtractUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setExtractError(null);
    setExtractSuccess(null);
    try {
      const dataUrl = file.type === "application/pdf" ? await fileToDataUrl(file) : await fileToCompressedDataUrl(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
      const res = await fetch(`/api/dashboard/${token}/ai/extract-services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setExtractError(data?.error ?? "Gagal membaca dokumen. Sila cuba lagi atau isi manual.");
        return;
      }
      const newServices: Service[] = (data.services ?? []).map((s: { id: string; name: string; durationMinutes: number; price: string | number; active: boolean; photoUrl: string | null; description: string | null }) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        price: String(s.price),
        active: s.active,
        photoUrl: s.photoUrl,
        description: s.description,
        promoPrice: null,
        badge: null,
      }));
      setServices((list) => [...list, ...newServices]);
      setExtractSuccess(`${newServices.length} servis berjaya ditambah oleh AI daripada dokumen ini.`);
    } catch {
      setExtractError("Gagal membaca dokumen. Sila cuba lagi atau isi manual.");
    } finally {
      setExtracting(false);
      if (extractInputRef.current) extractInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <label
        className={`card-tap flex items-center gap-3 rounded-2xl border border-dashed border-brand-400/50 bg-[color:var(--surface-2)]/60 px-4 py-3.5 ${
          extracting ? "pointer-events-none opacity-60" : "cursor-pointer"
        }`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-brand-400">
          {extracting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          ) : (
            <FileUpIcon className="h-5 w-5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[color:var(--text-primary)]">
            <SparkleIcon className="h-3.5 w-3.5 text-brand-400" />
            {extracting ? "AI sedang membaca dokumen..." : "Upload Senarai Harga (AI)"}
          </span>
          <span className="block text-xs text-[color:var(--text-secondary)]">Gambar atau PDF — servis diisi automatik</span>
        </span>
        <input
          ref={extractInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleExtractUpload}
          disabled={extracting}
        />
      </label>
      {extractError && <p className="-mt-3 rounded-xl bg-red-500/15 px-3.5 py-2.5 text-xs font-medium text-red-400">{extractError}</p>}
      {extractSuccess && <p className="-mt-3 rounded-xl bg-emerald-500/15 px-3.5 py-2.5 text-xs font-medium text-emerald-400">{extractSuccess}</p>}

      <div className="flex flex-col gap-3">
        {services.length === 0 && (
          <div className="card flex flex-col items-center gap-1 py-8 text-center animate-fade-in">
            <p className="text-sm font-medium text-[color:var(--text-secondary)]">Belum ada servis.</p>
            <p className="text-xs text-[color:var(--text-muted)]">Tambah servis pertama anda di bawah.</p>
          </div>
        )}
        {services.map((s, i) => (
          <div
            key={s.id}
            className={`card flex flex-col gap-2 animate-fade-in ${!s.active ? "opacity-50" : ""}`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <label className="card-tap relative shrink-0 cursor-pointer">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl">
                    {s.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photoUrl} alt={s.name} className="h-14 w-14 object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center bg-[color:var(--surface-2)] text-brand-300">
                        <CameraIcon className="h-5 w-5" />
                      </div>
                    )}
                    {s.badge && SERVICE_BADGES.includes(s.badge as ServiceBadge) && (
                      <ServiceBadgeRibbon badge={s.badge as ServiceBadge} size="sm" />
                    )}
                  </div>
                  {uploadingFor === s.id && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--surface-2)] text-brand-500 shadow-sm ring-1 ring-[color:var(--border-strong)]">
                    <CameraIcon className="h-3 w-3" />
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleExistingPhoto(s, e)}
                    disabled={uploadingFor === s.id}
                  />
                </label>

                {editingId === s.id ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <input
                      className="w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-2)] px-3 py-1.5 text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-brand-400"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nama servis"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={fieldLabelClass}>Tempoh (minit)</label>
                        <input
                          className={fieldInputClass}
                          type="number"
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={fieldLabelClass}>Harga asal (RM)</label>
                        <input
                          className={fieldInputClass}
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={fieldLabelClass}>Harga promo (RM)</label>
                        <input
                          className={fieldInputClass}
                          type="number"
                          value={editPromoPrice}
                          onChange={(e) => setEditPromoPrice(e.target.value)}
                          placeholder="Tiada promo"
                        />
                      </div>
                      <div>
                        <label className={fieldLabelClass}>Tag</label>
                        <select
                          className={fieldInputClass}
                          value={editBadge ?? ""}
                          onChange={(e) => setEditBadge(e.target.value ? (e.target.value as ServiceBadge) : null)}
                        >
                          <option value="">Tiada tag</option>
                          {SERVICE_BADGES.map((b) => (
                            <option key={b} value={b}>
                              {BADGE_LABELS[b]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {hasPromo(editPrice || "0", editPromoPrice || null) && (
                      <p className="text-[11px] text-[color:var(--text-secondary)]">
                        Pelanggan nampak:{" "}
                        <span className="text-[color:var(--text-muted)] line-through">RM{Number(editPrice).toFixed(0)}</span>{" "}
                        <span className="font-semibold text-brand-500">RM{Number(editPromoPrice).toFixed(0)}</span>
                      </p>
                    )}
                    <textarea
                      className="w-full resize-none rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-2)] px-3 py-1.5 text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-brand-400"
                      rows={2}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Penerangan servis (dipaparkan di skrin Butiran Servis pelanggan)"
                    />
                    {editError && <p className="text-xs font-medium text-red-400">{editError}</p>}
                    <div className="mt-0.5 flex gap-4">
                      <button
                        type="button"
                        onClick={() => saveEdit(s)}
                        disabled={savingEdit}
                        className="text-xs font-semibold text-brand-600 active:opacity-60 disabled:opacity-50"
                      >
                        {savingEdit ? "Menyimpan..." : "Simpan"}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-xs font-semibold text-[color:var(--text-muted)] active:opacity-60">
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => startEdit(s)} className="min-w-0 flex-1 text-left">
                    <p className="truncate font-semibold text-[color:var(--text-primary)]">{s.name}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">
                      {s.durationMinutes} minit &middot;{" "}
                      {hasPromo(s.price, s.promoPrice) ? (
                        <>
                          <span className="text-[color:var(--text-muted)] line-through">RM{Number(s.price).toFixed(0)}</span>{" "}
                          <span className="font-semibold text-brand-500">RM{Number(s.promoPrice).toFixed(0)}</span>
                        </>
                      ) : (
                        <>RM{Number(s.price).toFixed(0)}</>
                      )}
                    </p>
                  </button>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button onClick={() => setPreviewService(s)} className="flex items-center gap-1 text-xs font-semibold text-brand-600 active:opacity-60">
                  <EyeIcon className="h-3.5 w-3.5" />
                  Pratonton
                </button>
                <button onClick={() => toggleActive(s)} className="text-xs font-semibold text-brand-600 active:opacity-60">
                  {s.active ? "Nyahaktif" : "Aktifkan"}
                </button>
                <button onClick={() => removeService(s.id)} className="flex items-center gap-1 text-xs font-semibold text-red-500 active:opacity-60">
                  <TrashIcon className="h-3.5 w-3.5" />
                  Buang
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={addService} className="card flex flex-col gap-3">
        <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Tambah servis baru</p>
        <input className="input" placeholder="Nama servis (cth: Urut Badan)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={fieldLabelClass}>Tempoh (minit)</label>
            <input className={fieldInputClass} type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div>
            <label className={fieldLabelClass}>Harga asal (RM)</label>
            <input className={fieldInputClass} type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={fieldLabelClass}>Harga promo (RM)</label>
            <input
              className={fieldInputClass}
              type="number"
              placeholder="Tiada promo"
              value={promoPrice}
              onChange={(e) => setPromoPrice(e.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>Tag</label>
            <select
              className={fieldInputClass}
              value={badge ?? ""}
              onChange={(e) => setBadge(e.target.value ? (e.target.value as ServiceBadge) : null)}
            >
              <option value="">Tiada tag</option>
              {SERVICE_BADGES.map((b) => (
                <option key={b} value={b}>
                  {BADGE_LABELS[b]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {hasPromo(price || "0", promoPrice || null) && (
          <p className="text-[11px] text-[color:var(--text-secondary)]">
            Pelanggan nampak: <span className="text-[color:var(--text-muted)] line-through">RM{Number(price).toFixed(0)}</span>{" "}
            <span className="font-semibold text-brand-500">RM{Number(promoPrice).toFixed(0)}</span>
          </p>
        )}
        <textarea
          className="input resize-none"
          rows={2}
          placeholder="Penerangan servis (optional, dipaparkan di skrin Butiran Servis pelanggan)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex items-center gap-3">
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Preview" className="h-12 w-12 rounded-xl object-cover" />
          )}
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand-600">
            <CameraIcon className="h-4 w-4" />
            {photoUrl ? "Tukar foto" : "Foto servis (optional)"}
            <input ref={newPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleNewPhoto} />
          </label>
        </div>
        {addError && <p className="text-xs font-medium text-red-400">{addError}</p>}
        <button type="submit" className="btn-secondary flex items-center justify-center gap-1.5" disabled={adding}>
          <PlusIcon className="h-4 w-4" />
          {adding ? "Menambah..." : "Tambah Servis"}
        </button>
      </form>

      {previewService && (
        <ServiceDetailSheet
          service={previewService}
          depositRequired={depositRequired}
          depositAmount={depositAmount}
          paymentMethod={paymentMethod}
          previewOnly
          onClose={() => setPreviewService(null)}
        />
      )}
    </div>
  );
}
