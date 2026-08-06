"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AREAS } from "@/lib/areas";
import { MapPinIcon } from "@/components/icons";

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
        <label className="mb-2 block text-sm font-semibold text-brand-900">Kawasan anda</label>
        <div className="relative">
          <MapPinIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-brand-300" />
          <select
            className="input appearance-none pl-11"
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
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-brand-900">Servis untuk</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGender("FEMALE")}
            className={`chip justify-center py-3.5 text-[15px] ${
              gender === "FEMALE"
                ? "border-brand-600 bg-brand-50 text-brand-700 shadow-[0_0_0_1px_theme(colors.brand.600)]"
                : "border-black/10 bg-white text-gray-600"
            }`}
          >
            Wanita
          </button>
          <button
            type="button"
            onClick={() => setGender("MALE")}
            className={`chip justify-center py-3.5 text-[15px] ${
              gender === "MALE"
                ? "border-brand-600 bg-brand-50 text-brand-700 shadow-[0_0_0_1px_theme(colors.brand.600)]"
                : "border-black/10 bg-white text-gray-600"
            }`}
          >
            Lelaki
          </button>
        </div>
        {gender === "MALE" && (
          <p className="mt-2 animate-fade-in text-xs text-gray-500">Pelanggan lelaki hanya dipadankan dengan terapis lelaki.</p>
        )}
      </div>

      <button type="submit" className="btn-primary mt-1 w-full" disabled={!area || !gender}>
        Cari Terapis
      </button>
    </form>
  );
}
