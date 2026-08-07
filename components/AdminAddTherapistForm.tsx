"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AREAS } from "@/lib/areas";
import { PlusIcon, LinkIcon, CopyIcon } from "@/components/icons";

export default function AdminAddTherapistForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"FEMALE" | "MALE" | "">("");
  const [areas, setAreas] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function toggleArea(a: string) {
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !phone || !gender || areas.length === 0) {
      setError("Sila lengkapkan semua maklumat.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/admin/therapists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, gender, coverageAreas: areas }),
    });
    const data = await res.json().catch(() => null);
    setSubmitting(false);
    if (!res.ok) {
      setError("Gagal menambah terapis.");
      return;
    }
    setCreatedLink(`${window.location.origin}/dashboard/${data.therapist.dashboardToken}`);
    setName("");
    setPhone("");
    setGender("");
    setAreas([]);
    router.refresh();
  }

  async function handleCopy() {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary flex w-full items-center justify-center gap-1.5">
        <PlusIcon className="h-4 w-4" />
        Tambah Terapis Secara Manual
      </button>
    );
  }

  return (
    <div className="card flex flex-col gap-3">
      <p className="text-[15px] font-bold text-brand-900">Tambah Terapis</p>

      {createdLink ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-600">Terapis ditambah! Kongsi pautan dashboard ini kepada mereka:</p>
          <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3 py-2.5">
            <span className="flex-1 truncate text-[13px] text-gray-600">{createdLink}</span>
            <button type="button" onClick={handleCopy} className="btn-ghost shrink-0 bg-brand-50 px-2.5 py-1.5 text-xs">
              <CopyIcon className="h-3.5 w-3.5" />
              {copied ? "Disalin!" : "Salin"}
            </button>
          </div>
          <button type="button" onClick={() => { setCreatedLink(null); setOpen(false); }} className="btn-ghost bg-brand-50">
            Selesai
          </button>
        </div>
      ) : (
        <>
          <input className="input" placeholder="Nama penuh" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="No. WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setGender("FEMALE")} className={`chip justify-center py-2.5 ${gender === "FEMALE" ? "chip-active" : ""}`}>Wanita</button>
            <button type="button" onClick={() => setGender("MALE")} className={`chip justify-center py-2.5 ${gender === "MALE" ? "chip-active" : ""}`}>Lelaki</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => toggleArea(a)}
                className={`chip ${areas.includes(a) ? "chip-active" : ""}`}
              >
                {a}
              </button>
            ))}
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1 bg-gray-50">
              Batal
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
              {submitting ? "Menambah..." : "Tambah"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
