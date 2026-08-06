"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AREAS } from "@/lib/areas";
import TopBar from "@/components/TopBar";

export default function TherapistRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"FEMALE" | "MALE" | "">("");
  const [clientGenderPolicy, setClientGenderPolicy] = useState<"FEMALE_ONLY" | "MALE_ONLY" | "BOTH">("FEMALE_ONLY");
  const [areas, setAreas] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleArea(a: string) {
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !phone || !gender || areas.length === 0) {
      setError("Sila lengkapkan semua maklumat wajib.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/therapists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, gender, clientGenderPolicy, coverageAreas: areas, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Pendaftaran gagal. Sila cuba lagi.");
        setSubmitting(false);
        return;
      }
      router.push(`/dashboard/${data.therapist.dashboardToken}`);
    } catch {
      setError("Pendaftaran gagal. Sila cuba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <TopBar title="Daftar Terapis" backHref="/" />
      <main className="flex-1 overflow-y-auto px-5 py-6">
        <p className="mb-6 animate-fade-in text-sm text-gray-500">
          Selepas daftar, anda akan dapat pautan dashboard peribadi — simpan pautan ini, ia digunakan untuk log masuk.
        </p>

        <form onSubmit={handleSubmit} className="flex animate-fade-in flex-col gap-5">
          <input className="input" placeholder="Nama penuh" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" placeholder="No. WhatsApp (cth: 0123456789)" value={phone} onChange={(e) => setPhone(e.target.value)} required />

          <div>
            <label className="mb-2 block text-sm font-semibold text-brand-900">Jantina anda</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setGender("FEMALE")} className={`chip justify-center py-3 ${gender === "FEMALE" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-black/10 bg-white text-gray-600"}`}>Wanita</button>
              <button type="button" onClick={() => setGender("MALE")} className={`chip justify-center py-3 ${gender === "MALE" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-black/10 bg-white text-gray-600"}`}>Lelaki</button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-brand-900">Pelanggan yang diterima</label>
            <select className="input" value={clientGenderPolicy} onChange={(e) => setClientGenderPolicy(e.target.value as any)}>
              <option value="FEMALE_ONLY">Wanita sahaja</option>
              <option value="MALE_ONLY">Lelaki sahaja</option>
              <option value="BOTH">Lelaki & Wanita</option>
            </select>
            <p className="mt-1.5 text-xs text-gray-400">Nota: pelanggan lelaki hanya akan dipadankan dengan terapis lelaki (polisi keselamatan).</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-brand-900">Kawasan liputan</label>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => toggleArea(a)}
                  className={`chip ${areas.includes(a) ? "border-brand-600 bg-brand-50 text-brand-700" : "border-black/10 bg-white text-gray-600"}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <textarea className="input" placeholder="Ringkasan pengalaman / kepakaran (opsyenal)" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Mendaftar..." : "Daftar"}
          </button>
        </form>
      </main>
    </>
  );
}
