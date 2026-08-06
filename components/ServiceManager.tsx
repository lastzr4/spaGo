"use client";

import { useRef, useState } from "react";
import { fileToCompressedDataUrl } from "@/lib/image";

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
        {services.length === 0 && <p className="text-sm text-gray-500">Belum ada servis. Tambah servis pertama anda di bawah.</p>}
        {services.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3">
            <div className="flex items-center gap-3">
              {s.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photoUrl} alt={s.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs text-brand-300">
                  Tiada foto
                </div>
              )}
              <div>
                <p className="font-medium text-brand-900">{s.name}</p>
                <p className="text-xs text-gray-500">{s.durationMinutes} minit &middot; RM{Number(s.price).toFixed(0)}</p>
                <label className="mt-1 inline-block cursor-pointer text-xs font-medium text-brand-600">
                  {uploadingFor === s.id ? "Memuat naik..." : s.photoUrl ? "Tukar foto" : "+ Tambah foto"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleExistingPhoto(s, e)} disabled={uploadingFor === s.id} />
                </label>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => toggleActive(s)} className="text-xs font-medium text-brand-600">
                {s.active ? "Nyahaktif" : "Aktifkan"}
              </button>
              <button onClick={() => removeService(s.id)} className="text-xs font-medium text-red-500">Buang</button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={addService} className="card flex flex-col gap-3">
        <p className="text-sm font-medium text-brand-900">Tambah servis baru</p>
        <input className="input" placeholder="Nama servis (cth: Urut Badan)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex gap-3">
          <input className="input" type="number" placeholder="Minit" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <input className="input" type="number" placeholder="Harga (RM)" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Preview" className="h-12 w-12 rounded-lg object-cover" />
          )}
          <label className="cursor-pointer text-sm text-brand-600">
            {photoUrl ? "Tukar foto" : "+ Foto servis (opsyenal)"}
            <input ref={newPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleNewPhoto} />
          </label>
        </div>
        <button type="submit" className="btn-secondary" disabled={adding}>
          {adding ? "Menambah..." : "+ Tambah Servis"}
        </button>
      </form>
    </div>
  );
}
