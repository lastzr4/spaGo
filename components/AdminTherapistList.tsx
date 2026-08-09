"use client";

import { useState } from "react";
import { TrashIcon, CheckCircleIcon, XIcon, LinkIcon } from "@/components/icons";
import ConfirmDialog from "@/components/ConfirmDialog";

type Therapist = {
  id: string;
  name: string;
  phone: string;
  gender: "MALE" | "FEMALE";
  coverageAreas: string[];
  active: boolean;
  isDemo: boolean;
  dashboardToken: string;
  bookingCount: number;
  reviewCount: number;
};

export default function AdminTherapistList({ initialTherapists }: { initialTherapists: Therapist[] }) {
  const [therapists, setTherapists] = useState(initialTherapists);
  const [busy, setBusy] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Therapist | null>(null);

  async function toggleActive(t: Therapist) {
    setBusy(t.id);
    const res = await fetch(`/api/admin/therapists/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !t.active }),
    });
    if (res.ok) {
      setTherapists((list) => list.map((x) => (x.id === t.id ? { ...x, active: !x.active } : x)));
    }
    setBusy(null);
  }

  async function removeTherapist(t: Therapist) {
    setBusy(t.id);
    const res = await fetch(`/api/admin/therapists/${t.id}`, { method: "DELETE" });
    if (res.ok) {
      setTherapists((list) => list.filter((x) => x.id !== t.id));
    }
    setBusy(null);
    setPendingDelete(null);
  }

  async function copyLink(t: Therapist) {
    const link = `${window.location.origin}/dashboard/${t.dashboardToken}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(t.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  }

  if (therapists.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-1 py-10 text-center">
        <p className="text-sm font-medium text-[color:var(--text-secondary)]">Tiada terapis lagi.</p>
      </div>
    );
  }

  const deleteDialog = (
    <ConfirmDialog
      open={pendingDelete !== null}
      title={`Padam ${pendingDelete?.name ?? ""}?`}
      message="Semua servis, slot, tempahan dan ulasan mereka turut dipadam. Tindakan ini tidak boleh dibatalkan."
      confirmLabel="Padam"
      danger
      busy={busy === pendingDelete?.id}
      onConfirm={() => pendingDelete && removeTherapist(pendingDelete)}
      onCancel={() => setPendingDelete(null)}
    />
  );

  return (
    <>
    {deleteDialog}
    <div className="flex flex-col gap-3">
      {therapists.map((t, i) => (
        <div key={t.id} className={`card animate-fade-in ${!t.active ? "opacity-60" : ""}`} style={{ animationDelay: `${i * 30}ms` }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-semibold text-[color:var(--text-primary)]">
                {t.name}
                {t.isDemo && <span className="shrink-0 rounded-full bg-[color:var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--text-muted)]">DEMO</span>}
              </p>
              <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">{t.gender === "FEMALE" ? "Wanita" : "Lelaki"} &middot; {t.coverageAreas.join(", ")}</p>
              <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">{t.phone} &middot; {t.bookingCount} tempahan &middot; {t.reviewCount} ulasan</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${t.active ? "bg-emerald-500/15 text-emerald-400" : "bg-[color:var(--surface-2)] text-[color:var(--text-muted)]"}`}>
              {t.active ? "Aktif" : "Tidak aktif"}
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => copyLink(t)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[color:var(--surface-2)] px-3 py-2 text-xs font-semibold text-brand-600 active:scale-[0.97]"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              {copiedId === t.id ? "Disalin!" : "Salin Pautan"}
            </button>
            <button
              type="button"
              onClick={() => toggleActive(t)}
              disabled={busy === t.id}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-400 active:scale-[0.97] disabled:opacity-40"
            >
              {t.active ? <XIcon className="h-3.5 w-3.5" /> : <CheckCircleIcon className="h-3.5 w-3.5" />}
              {t.active ? "Nyahaktif" : "Aktifkan"}
            </button>
            <button
              type="button"
              onClick={() => setPendingDelete(t)}
              disabled={busy === t.id}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-500 active:scale-[0.97] disabled:opacity-40"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Padam
            </button>
          </div>
        </div>
      ))}
    </div>
    </>
  );
}
