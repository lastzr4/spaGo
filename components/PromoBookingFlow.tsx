"use client";

import { useState } from "react";
import BookingFlow from "@/components/BookingFlow";

type Service = { id: string; name: string; durationMinutes: number; price: string; photoUrl?: string | null };
type Slot = { id: string; date: string; startTime: string; endTime: string };

export default function PromoBookingFlow({
  therapistId,
  therapistPhone,
  services,
  slots,
  defaultGender,
}: {
  therapistId: string;
  therapistPhone: string;
  services: Service[];
  slots: Slot[];
  defaultGender: "MALE" | "FEMALE";
}) {
  const [gender, setGender] = useState<"MALE" | "FEMALE">(defaultGender);

  return (
    <div>
      <div className="mb-5 rounded-2xl bg-brand-50/60 p-4">
        <label className="mb-2 block text-sm font-semibold text-brand-900">Anda pelanggan</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGender("FEMALE")}
            className={`chip justify-center py-2.5 text-[14px] ${gender === "FEMALE" ? "chip-active" : ""}`}
          >
            Wanita
          </button>
          <button
            type="button"
            onClick={() => setGender("MALE")}
            className={`chip justify-center py-2.5 text-[14px] ${gender === "MALE" ? "chip-active" : ""}`}
          >
            Lelaki
          </button>
        </div>
      </div>
      <BookingFlow
        therapistId={therapistId}
        therapistPhone={therapistPhone}
        services={services}
        slots={slots}
        customerGender={gender}
      />
    </div>
  );
}
