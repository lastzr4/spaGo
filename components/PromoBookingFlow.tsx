"use client";

import { useState } from "react";
import BookingFlow from "@/components/BookingFlow";
import SegmentedToggle from "@/components/SegmentedToggle";

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: string;
  photoUrl?: string | null;
  description?: string | null;
  promoPrice?: string | null;
  badge?: string | null;
};
type Slot = { id: string; date: string; startTime: string; endTime: string };

export default function PromoBookingFlow({
  therapistId,
  therapistName,
  therapistPhone,
  therapistRating = null,
  therapistReviewCount = 0,
  therapistBaseLat = null,
  therapistBaseLng = null,
  services,
  slots,
  defaultGender,
  depositRequired = false,
  depositAmount = null,
  paymentMethod = null,
  qrCodeUrl = null,
  extraChargesNote = null,
  cancellationWindowHours = 2,
  travelFeeEnabled = false,
  travelFreeRadiusKm = 5,
  travelRatePerKm = 1,
}: {
  therapistId: string;
  therapistName: string;
  therapistPhone: string;
  therapistRating?: number | null;
  therapistReviewCount?: number;
  therapistBaseLat?: number | null;
  therapistBaseLng?: number | null;
  services: Service[];
  slots: Slot[];
  defaultGender: "MALE" | "FEMALE";
  depositRequired?: boolean;
  depositAmount?: string | null;
  paymentMethod?: "QR" | "CASH" | null;
  qrCodeUrl?: string | null;
  extraChargesNote?: string | null;
  cancellationWindowHours?: number;
  travelFeeEnabled?: boolean;
  travelFreeRadiusKm?: number;
  travelRatePerKm?: number;
}) {
  const [gender, setGender] = useState<"MALE" | "FEMALE">(defaultGender);

  return (
    <div>
      <div className="mb-5 rounded-2xl bg-[color:var(--surface-2)]/60 p-4">
        <label className="mb-2 block text-sm font-semibold text-[color:var(--text-primary)]">Anda pelanggan</label>
        <SegmentedToggle
          size="sm"
          options={[
            { value: "FEMALE" as const, label: "Wanita" },
            { value: "MALE" as const, label: "Lelaki" },
          ]}
          value={gender}
          onChange={setGender}
        />
      </div>
      <BookingFlow
        therapistId={therapistId}
        therapistName={therapistName}
        therapistPhone={therapistPhone}
        therapistRating={therapistRating}
        therapistReviewCount={therapistReviewCount}
        therapistBaseLat={therapistBaseLat}
        therapistBaseLng={therapistBaseLng}
        services={services}
        slots={slots}
        customerGender={gender}
        depositRequired={depositRequired}
        depositAmount={depositAmount}
        paymentMethod={paymentMethod}
        qrCodeUrl={qrCodeUrl}
        extraChargesNote={extraChargesNote}
        cancellationWindowHours={cancellationWindowHours}
        travelFeeEnabled={travelFeeEnabled}
        travelFreeRadiusKm={travelFreeRadiusKm}
        travelRatePerKm={travelRatePerKm}
      />
    </div>
  );
}
