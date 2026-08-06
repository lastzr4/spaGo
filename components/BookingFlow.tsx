"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildWhatsAppBookingMessage, buildWhatsAppLink } from "@/lib/whatsapp";

type Service = { id: string; name: string; durationMinutes: number; price: string; photoUrl?: string | null };
type Slot = { id: string; date: string; startTime: string; endTime: string };

export default function BookingFlow({
  therapistId,
  therapistPhone,
  services,
  slots,
  customerGender,
}: {
  therapistId: string;
  therapistPhone: string;
  services: Service[];
  slots: Slot[];
  customerGender: "MALE" | "FEMALE";
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [slotId, setSlotId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slotsByDate = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const s of slots) {
      const d = s.date.slice(0, 10);
      map[d] = map[d] ? [...map[d], s] : [s];
    }
    return map;
  }, [slots]);

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedSlot = slots.find((s) => s.id === slotId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!serviceId || !slotId || !name || !phone || !address) {
      setError("Sila lengkapkan semua maklumat.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapistId,
          serviceId,
          slotId,
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          customerGender,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "SLOT_UNAVAILABLE"
            ? "Slot ini baru sahaja ditempah orang lain. Sila pilih slot lain."
            : "Tempahan gagal. Sila cuba lagi."
        );
        setSubmitting(false);
        return;
      }

      const message = buildWhatsAppBookingMessage({
        customerName: name,
        serviceName: selectedService?.name ?? "",
        durationMinutes: selectedService?.durationMinutes ?? 0,
        date: selectedSlot?.date.slice(0, 10) ?? "",
        startTime: selectedSlot?.startTime ?? "",
        address,
      });
      const link = buildWhatsAppLink(therapistPhone, message);
      window.location.href = link;
    } catch {
      setError("Tempahan gagal. Sila cuba lagi.");
      setSubmitting(false);
    }
  }

  if (services.length === 0) {
    return <p className="text-sm text-gray-500">Terapis ini belum menetapkan sebarang servis.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-brand-900">Pilih servis</label>
        <div className="flex flex-col gap-2">
          {services.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setServiceId(s.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                serviceId === s.id ? "border-brand-600 bg-brand-50" : "border-black/10 bg-white"
              }`}
            >
              {s.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photoUrl} alt={s.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              ) : null}
              <span className="flex flex-1 items-center justify-between">
                <span>
                  <span className="block font-medium text-brand-900">{s.name}</span>
                  <span className="block text-xs text-gray-500">{s.durationMinutes} minit</span>
                </span>
                <span className="font-medium text-brand-700">RM{Number(s.price).toFixed(0)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-brand-900">Pilih slot masa</label>
        {Object.keys(slotsByDate).length === 0 ? (
          <p className="text-sm text-gray-500">Tiada slot kosong buat masa ini.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(slotsByDate).map(([date, daySlots]) => (
              <div key={date}>
                <p className="mb-1.5 text-xs font-medium text-gray-400">{date}</p>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setSlotId(s.id)}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        slotId === s.id ? "border-brand-600 bg-brand-50 text-brand-700" : "border-black/10 bg-white text-gray-600"
                      }`}
                    >
                      {s.startTime}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <input className="input" placeholder="Nama penuh" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input" placeholder="No. telefon anda" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <textarea className="input" placeholder="Alamat penuh untuk urutan" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="btn-primary" disabled={submitting || !slotId}>
        {submitting ? "Menghantar..." : "Tempah & Hantar ke WhatsApp"}
      </button>
    </form>
  );
}
