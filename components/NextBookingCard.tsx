"use client";

import { useState } from "react";
import { CalendarIcon, ChevronLeftIcon, PhoneIcon, MapPinIcon, ClockIcon, SendIcon } from "@/components/icons";
import { buildWhatsAppLink, buildWhatsAppReminderMessage } from "@/lib/whatsapp";

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceName: string;
  durationMinutes: number;
  date: string;
  startTime: string;
  minutesUntil: number;
};

export default function NextBookingCard({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false);
  const dueSoon = booking.minutesUntil <= 60;

  const reminderLink = buildWhatsAppLink(
    booking.customerPhone,
    buildWhatsAppReminderMessage({
      customerName: booking.customerName,
      serviceName: booking.serviceName,
      startTime: booking.startTime,
      address: booking.customerAddress,
    })
  );

  return (
    <div className={`mb-6 animate-fade-in rounded-2xl border p-4 ${dueSoon ? "border-amber-200 bg-amber-50" : "border-brand-100 bg-brand-50/60"}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ${dueSoon ? "animate-pulse-ring text-amber-500" : "text-brand-600"}`}>
          {dueSoon ? <ClockIcon className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${dueSoon ? "text-amber-600" : "text-brand-500"}`}>
            {dueSoon ? "Bermula tidak lama lagi" : "Tempahan Seterusnya"}
          </p>
          <p className="truncate text-sm font-semibold text-brand-900">
            {booking.customerName} &middot; {booking.serviceName}
          </p>
          <p className="text-xs text-gray-500">{booking.date}, {booking.startTime}</p>
        </div>
        <ChevronLeftIcon className={`h-4 w-4 shrink-0 text-gray-300 transition-transform ${open ? "rotate-90" : "-rotate-90"}`} />
      </button>

      {open && (
        <div className="mt-3 flex animate-fade-in flex-col gap-2.5 border-t border-black/[0.05] pt-3">
          <a
            href={`tel:${booking.customerPhone}`}
            className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 text-sm font-medium text-gray-700 active:scale-[0.98]"
          >
            <PhoneIcon className="h-4 w-4 shrink-0 text-brand-500" />
            {booking.customerPhone}
          </a>
          <div className="flex items-start gap-2.5 rounded-xl bg-white px-3.5 py-3 text-sm text-gray-600">
            <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            {booking.customerAddress}
          </div>
          <p className="px-1 text-xs text-gray-500">{booking.durationMinutes} minit</p>

          <a
            href={reminderLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex items-center justify-center gap-1.5"
          >
            <SendIcon className="h-4 w-4" />
            Hantar Reminder WhatsApp
          </a>
          <p className="px-1 text-center text-[11px] text-gray-400">
            Membuka WhatsApp dengan mesej reminder siap ditulis — anda tekan hantar.
          </p>
        </div>
      )}
    </div>
  );
}
