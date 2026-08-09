"use client";

import { useRef, useState } from "react";
import { fileToCompressedDataUrl } from "@/lib/image";
import { CameraIcon, PlusIcon, TrashIcon, SparkleIcon } from "@/components/icons";

type Service = { id: string; name: string; durationMinutes: number; price: string; active: boolean; photoUrl?: string | null; description?: string | null };

export default function ServiceManager({ token, initialServices }: { token: string; initialServices: Service[] }) {
  const [services, setServices] = useState(initialServices);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<Record<string, string>>({});
  const [guidanceLoading, setGuidanceLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const newPhotoInputRef = useRef<HTMLInputElement>(null);

  function startEdit(service: Service) {
    setEditingId(service.id);
    setEditName(service.name);
    setEditDuration(String(service.durationMinutes));
    setEditPrice(service.price);
    setEditDescription(service.description ?? "");
  }

  async function saveEdit(service: Service) {
    if (!editName.trim() || !editDuration || !editPrice) return;
    setSavingEdit(true);
    const res = await fetch(`/api/dashboard/${token}/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        durationMinutes: Number(editDuration),
        price: Number(editPrice),
        description: editDescription.trim() || null,
      }),
    });
    if (res.ok) {
      setServices((list) =>
        list.map((s) =>
          s.id === service.id
            ? { ...s, name: editName.trim(), durationMinutes: Number(editDuration), price: editPrice, description: editDescription.trim() || null }
            : s
        )
      );
      setEditingId(null);
    }
    setSavingEdit(false);
  }

  async function fetchGuidance(service: Service) {
    setGuidanceLoading(service.id);
    try {
      const res = await fetch(`/api/dashboard/${token}/ai/pricing-guidance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id }),
      });
      const data = await res.json().catch(() => null);
      setGuidance((g) => ({
        ...g,
        [service.id]: data?.guidance ?? "Gagal menjana panduan harga. Sila cuba lagi.",
      }));
    } catch {
      setGuidance((g) => ({ ...g, [service.id]: "Gagal menjana panduan harga. Sila cuba lagi." }));
    } finally {
      setGuidanceLoading(null);
    }
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !duration || !price) return;
    setAdding(true);
    const res = await fetch(`/api/dashboard/${token}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, durationMinutes: Number(duration), price: Number(price), description: description.trim() || null, photoUrl }),
    });
    const data = await res.json();
    if (res.ok) {
      setServices((s) => [...s, data.service]);
      setName("");
      setDuration("60");
      setPrice("");
      setDescription("");
      setPhotoUrl(null);
      if (newPhotoInputRef.current) newPhotoInputRef.current.value = "";
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

  return (
    <div className="flex flex-col gap-6">
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
                  {s.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photoUrl} alt={s.name} className="h-14 w-14 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--surface-2)] text-brand-300">
                      <CameraIcon className="h-5 w-5" />
                    </div>
                  )}
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
                    <div className="flex gap-2">
                      <input
                        className="w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-2)] px-3 py-1.5 text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-brand-400"
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        placeholder="Minit"
                      />
                      <input
                        className="w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-2)] px-3 py-1.5 text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-brand-400"
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="Harga (RM)"
                      />
                    </div>
                    <textarea
                      className="w-full resize-none rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-2)] px-3 py-1.5 text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-brand-400"
                      rows={2}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Penerangan servis (dipaparkan di skrin Butiran Servis pelanggan)"
                    />
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
                    <p className="text-xs text-[color:var(--text-secondary)]">{s.durationMinutes} minit &middot; RM{Number(s.price).toFixed(0)}</p>
                  </button>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button onClick={() => toggleActive(s)} className="text-xs font-semibold text-brand-600 active:opacity-60">
                  {s.active ? "Nyahaktif" : "Aktifkan"}
                </button>
                <button onClick={() => removeService(s.id)} className="flex items-center gap-1 text-xs font-semibold text-red-500 active:opacity-60">
                  <TrashIcon className="h-3.5 w-3.5" />
                  Buang
                </button>
              </div>
            </div>

            <div className="border-t border-[color:var(--border)] pt-2">
              <button
                type="button"
                onClick={() => fetchGuidance(s)}
                disabled={guidanceLoading === s.id}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 active:opacity-60 disabled:opacity-50"
              >
                <SparkleIcon className="h-3.5 w-3.5" />
                {guidanceLoading === s.id ? "Menjana..." : guidance[s.id] ? "Jana semula panduan harga AI" : "Panduan harga AI"}
              </button>
              {guidance[s.id] && (
                <p className="mt-1.5 rounded-xl bg-[color:var(--surface-2)]/60 px-3 py-2 text-xs leading-relaxed text-[color:var(--text-secondary)]">{guidance[s.id]}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={addService} className="card flex flex-col gap-3">
        <p className="text-[15px] font-bold text-[color:var(--text-primary)]">Tambah servis baru</p>
        <input className="input" placeholder="Nama servis (cth: Urut Badan)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex gap-3">
          <input className="input" type="number" placeholder="Minit" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <input className="input" type="number" placeholder="Harga (RM)" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
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
        <button type="submit" className="btn-secondary flex items-center justify-center gap-1.5" disabled={adding}>
          <PlusIcon className="h-4 w-4" />
          {adding ? "Menambah..." : "Tambah Servis"}
        </button>
      </form>
    </div>
  );
}
