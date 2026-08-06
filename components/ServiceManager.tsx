"use client";

import { useRef, useState } from "react";
import { fileToCompressedDataUrl } from "@/lib/image";
import { CameraIcon, PlusIcon, TrashIcon } from "@/components/icons";

type Service = { id: string; name: string; durationMinutes: number; price: string; active: boolean; photoUrl?: string | null };

export default function ServiceManager({ token, initialServices }: { token: string; initialServices: Service[] }) {
  const [services, setServices] = useState(initialServices);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const newPhotoInputRef = useRef<HTMLInputElement>(null);

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !duration || !price) return;
    setAdding(true);
    const res = await fetch(`/api/dashboard/${token}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, durationMinutes: Number(duration), price: Number(price), photoUrl }),
    });
    const data = await res.json();
    if (res.ok) {
      setServices((s) => [...s, data.service]);
      setName("");
      setDuration("60");
      setPrice("");
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
            <p className="text-sm font-medium text-gray-600">Belum ada servis.</p>
            <p className="text-xs text-gray-400">Tambah servis pertama anda di bawah.</p>
          </div>
        )}
        {services.map((s, i) => (
          <div
            key={s.id}
            className={`card flex items-center justify-between gap-3 animate-fade-in ${!s.active ? "opacity-50" : ""}`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex min-w-0 items-center gap-3">
              {s.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photoUrl} alt={s.name} className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-300">
                  <CameraIcon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-brand-900">{s.name}</p>
                <p className="text-xs text-gray-500">{s.durationMinutes} minit &middot; RM{Number(s.price).toFixed(0)}</p>
                <label className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-600">
                  <CameraIcon className="h-3 w-3" />
                  {uploadingFor === s.id ? "Memuat naik..." : s.photoUrl ? "Tukar foto" : "Tambah foto"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleExistingPhoto(s, e)} disabled={uploadingFor === s.id} />
                </label>
              </div>
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
        ))}
      </div>

      <form onSubmit={addService} className="card flex flex-col gap-3">
        <p className="text-[15px] font-bold text-brand-900">Tambah servis baru</p>
        <input className="input" placeholder="Nama servis (cth: Urut Badan)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex gap-3">
          <input className="input" type="number" placeholder="Minit" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <input className="input" type="number" placeholder="Harga (RM)" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Preview" className="h-12 w-12 rounded-xl object-cover" />
          )}
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand-600">
            <CameraIcon className="h-4 w-4" />
            {photoUrl ? "Tukar foto" : "Foto servis (opsyenal)"}
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
