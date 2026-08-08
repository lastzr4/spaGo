"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarIcon, CheckCircleIcon, XIcon } from "@/components/icons";
import { buildGoogleCalendarLink } from "@/lib/googleCalendar";

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Disahkan",
  CANCELLED: "Dibatalkan",
  COMPLETED: "Selesai",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  CONFIRMED: "bg-brand-50 text-brand-600",
  CANCELLED: "bg-red-50 text-red-500",
  COMPLETED: "bg-emerald-50 text-emerald-600",
};

type StatusFilter = "ALL" | Booking["status"];

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "PENDING", label: "Menunggu" },
  { value: "CONFIRMED", label: "Disahkan" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

export default function BookingList({ token, initialBookings }: { token: string; initialBookings: Booking[] }) {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const [bookings, setBookings] = useState(initialBookings);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>(
    initialStatus && ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(initialStatus)
      ? (initialStatus as StatusFilter)
      : "ALL"
  );

  const filteredBookings = useMemo(
    () => (filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  );

  async function updateStatus(id: string, status: Booking["status"]) {
    setUpdating(id);
    const res = await fetch(`/api/dashboard/${token}/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setBookings((list) => list.map((b) => (b.id === id ? { ...b, status } : b)));
    }
    setUpdating(null);
  }

  if (bookings.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 py-10 text-center">
        <CalendarIcon className="h-8 w-8 text-brand-200" />
        <p className="text-sm text-gray-500">Belum ada tempahan lagi.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {FILTERS.map((f) => {
          const count = f.value === "ALL" ? bookings.length : bookings.filter((b) => b.status === f.value).length;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`chip shrink-0 ${filter === f.value ? "chip-active" : ""}`}
            >
              {f.label}
              <span className={`ml-0.5 text-[11px] ${filter === f.value ? "text-brand-500" : "text-gray-400"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {filteredBookings.length === 0 && (
        <div className="card flex flex-col items-center gap-2 py-10 text-center">
          <CalendarIcon className="h-8 w-8 text-brand-200" />
          <p className="text-sm text-gray-500">Tiada tempahan dalam kategori ini.</p>
        </div>
      )}

      {filteredBookings.map((b, i) => (
        <div key={b.id} className="card animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-brand-900">{b.customerName}</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[b.status] ?? "bg-gray-50 text-gray-500"}`}>
              {STATUS_LABEL[b.status] ?? b.status}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-600">{b.serviceName} &middot; {b.date} {b.startTime}</p>
          <p className="mt-1 text-xs text-gray-400">{b.customerPhone} &middot; {b.customerAddress}</p>

          {(b.status === "PENDING" || b.status === "CONFIRMED") && (
            <div className="mt-3 flex gap-2">
              {b.status === "PENDING" && (
                <button
                  type="button"
                  onClick={() => updateStatus(b.id, "CONFIRMED")}
                  disabled={updating === b.id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-600 active:scale-[0.97] disabled:opacity-40"
                >
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Sahkan
                </button>
              )}
              {b.status === "CONFIRMED" && (
                <button
                  type="button"
                  onClick={() => updateStatus(b.id, "COMPLETED")}
                  disabled={updating === b.id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600 active:scale-[0.97] disabled:opacity-40"
                >
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Tandakan Selesai
                </button>
              )}
              <button
                type="button"
                onClick={() => updateStatus(b.id, "CANCELLED")}
                disabled={updating === b.id}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 active:scale-[0.97] disabled:opacity-40"
              >
                <XIcon className="h-3.5 w-3.5" />
                Batal
              </button>
            </div>
          )}

          {b.status === "CONFIRMED" && (
            <a
              href={buildGoogleCalendarLink({
                title: `SpaGo: ${b.serviceName} - ${b.customerName}`,
                description: `Tempahan SpaGo\nPelanggan: ${b.customerName}\nTelefon: ${b.customerPhone}\nServis: ${b.serviceName}`,
                location: b.customerAddress,
                date: b.date,
                startTime: b.startTime,
                endTime: b.endTime,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-black/[0.06] px-3 py-2 text-xs font-semibold text-gray-500 active:scale-[0.97]"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Tambah ke Google Calendar
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
