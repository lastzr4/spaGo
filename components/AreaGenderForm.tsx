"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AreaSelect from "@/components/AreaSelect";
import SegmentedToggle from "@/components/SegmentedToggle";

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
        <AreaSelect value={area} onChange={setArea} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-brand-900">Servis untuk</label>
        <SegmentedToggle
          options={[
            { value: "FEMALE" as const, label: "Wanita" },
            { value: "MALE" as const, label: "Lelaki" },
          ]}
          value={gender}
          onChange={setGender}
        />
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
