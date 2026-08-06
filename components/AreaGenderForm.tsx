"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AREAS } from "@/lib/areas";

export default function AreaGenderForm() {
  const router = useRouter();
  const [area, setArea] = useState("");
  const [gender, setGender] = useState<"FEMALE" | "MALE" | "">("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!area || !gender) return;
    const params = new URLSearchParams({ area, gender });
    router.push(`/therapists?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-brand-900">Kawasan anda</label>
        <select
          className="input"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          required
        >
          <option value="" disabled>Pilih kawasan</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-brand-900">Servis untuk</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGender("FEMALE")}
            className={`rounded-xl border px-4 py-4 text-center font-medium transition-colors ${
              gender === "FEMALE"
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-black/10 bg-white text-gray-600"
            }`}
          >
            Wanita
          </button>
          <button
            type="button"
            onClick={() => setGender("MALE")}
            className={`rounded-xl border px-4 py-4 text-center font-medium transition-colors ${
              gender === "MALE"
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-black/10 bg-white text-gray-600"
            }`}
          >
            Lelaki
          </button>
        </div>
        {gender === "MALE" && (
          <p className="mt-2 text-xs text-gray-500">Pelanggan lelaki hanya dipadankan dengan terapis lelaki.</p>
        )}
      </div>

      <button type="submit" className="btn-primary mt-2" disabled={!area || !gender}>
        Cari Terapis
      </button>
    </form>
  );
}
