"use client";

import { useMemo, useState } from "react";
import { buildWhatsAppFollowUpMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import {
  UsersIcon,
  PhoneIcon,
  ChevronLeftIcon,
  CopyIcon,
  SendIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@/components/icons";

export type CustomerRow = {
  phone: string;
  name: string;
  totalBookings: number;
  completedBookings: number;
  lastBookingDate: string;
  lastServiceName: string;
  referralCode: string;
  daysSinceLast: number;
  needsFollowUp: boolean;
  note: string | null;
};

const WEEKDAY = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];
const MONTH = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return `${WEEKDAY[date.getDay()]}, ${date.getDate()} ${MONTH[date.getMonth()]}`;
}

function CustomerCard({
  customer,
  token,
  therapistName,
  open,
  onToggle,
}: {
  customer: CustomerRow;
  token: string;
  therapistName: string;
  open: boolean;
  onToggle: () => void;
}) {
  const [note, setNote] = useState(customer.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function saveNote() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/dashboard/${token}/customers/note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: customer.phone, note }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(customer.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  const followUpLink = buildWhatsAppLink(
    customer.phone,
    buildWhatsAppFollowUpMessage({ customerName: customer.name, therapistName, referralCode: customer.referralCode })
  );

  return (
    <div className={`card animate-fade-in ${customer.needsFollowUp ? "ring-1 ring-amber-300" : ""}`}>
      <button type="button" onClick={onToggle} className="card-tap flex w-full items-center justify-between gap-3 text-left">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "color-mix(in srgb, var(--brand, #7a51c9) 12%, white)", color: "var(--brand, #7a51c9)" }}
          >
            {customer.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-900">{customer.name}</p>
            <p className="truncate text-xs text-gray-500">
              {customer.totalBookings} tempahan &middot; kali terakhir {formatDate(customer.lastBookingDate)}
            </p>
          </div>
        </div>
        <ChevronLeftIcon className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-90" : "-rotate-90"}`} />
      </button>

      {customer.needsFollowUp && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
          Dah {customer.daysSinceLast} hari tak book — mungkin masa untuk follow-up.
        </div>
      )}

      {open && (
        <div className="mt-3 flex flex-col gap-3 border-t border-black/[0.04] pt-3">
          <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm text-gray-600 active:opacity-60">
            <PhoneIcon className="h-4 w-4 text-brand-500" />
            {customer.phone}
          </a>

          <p className="text-xs text-gray-500">
            Servis terakhir: <span className="font-medium text-gray-700">{customer.lastServiceName}</span> &middot; {customer.completedBookings} selesai
          </p>

          <div className="flex items-center justify-between rounded-xl bg-brand-50/60 px-3 py-2.5">
            <div>
              <p className="text-[11px] font-medium text-gray-500">Kod rujukan</p>
              <p className="text-sm font-bold tracking-wide text-brand-700">{customer.referralCode}</p>
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 shadow-sm active:scale-95"
            >
              {copied ? <CheckCircleIcon filled className="h-3.5 w-3.5 text-green-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
              {copied ? "Disalin" : "Salin"}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Nota pelanggan (tekanan, alahan, dll)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="cth: suka tekanan sederhana, alahan minyak lavender"
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
            <button
              type="button"
              onClick={saveNote}
              disabled={saving}
              className="mt-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 active:scale-95 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : saved ? "Tersimpan ✓" : "Simpan nota"}
            </button>
          </div>

          {customer.needsFollowUp && (
            <a
              href={followUpLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
            >
              <SendIcon className="h-4 w-4" />
              Hantar follow-up WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomerList({ customers, token, therapistName }: { customers: CustomerRow[]; token: string; therapistName: string }) {
  const [openPhone, setOpenPhone] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customers, query]);

  const followUpCount = customers.filter((c) => c.needsFollowUp).length;

  if (customers.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 py-10 text-center animate-fade-in">
        <UsersIcon className="h-8 w-8 text-gray-300" />
        <p className="text-sm font-medium text-gray-600">Belum ada pelanggan lagi.</p>
        <p className="text-xs text-gray-400">Sejarah pelanggan akan muncul di sini selepas tempahan pertama.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {followUpCount > 0 && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700 animate-fade-in">
          <AlertTriangleIcon className="h-4 w-4 shrink-0" />
          {followUpCount} pelanggan sudah lama tak book — pertimbangkan follow-up.
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama atau nombor telefon..."
        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400"
      />

      {filtered.map((c) => (
        <CustomerCard
          key={c.phone}
          customer={c}
          token={token}
          therapistName={therapistName}
          open={openPhone === c.phone}
          onToggle={() => setOpenPhone((cur) => (cur === c.phone ? null : c.phone))}
        />
      ))}

      {filtered.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Tiada pelanggan sepadan.</p>}
    </div>
  );
}
