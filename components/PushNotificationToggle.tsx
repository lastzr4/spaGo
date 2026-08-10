"use client";

import { useEffect, useState } from "react";
import { BellIcon, CheckCircleIcon } from "@/components/icons";

// urlBase64 -> Uint8Array, the standard boilerplate the Push API needs for
// applicationServerKey (it won't accept a plain base64 string directly).
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "denied" | "off" | "on" | "busy";

export default function PushNotificationToggle({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setStatus(sub ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setStatus("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string),
      });
      const json = sub.toJSON();
      await fetch(`/api/dashboard/${token}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      setStatus("on");
    } catch (err) {
      console.error("[PushNotificationToggle] enable failed:", err);
      setStatus("off");
    }
  }

  async function disable() {
    setStatus("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/dashboard/${token}/push/subscribe`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch (err) {
      console.error("[PushNotificationToggle] disable failed:", err);
      setStatus("on");
    }
  }

  if (status === "checking" || status === "unsupported") return null;

  if (status === "denied") {
    return (
      <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3 text-xs text-[color:var(--text-muted)] animate-fade-in">
        <BellIcon className="h-4 w-4 shrink-0" />
        Notifikasi disekat di penyemak imbas anda. Aktifkan semula melalui tetapan penyemak imbas jika mahu terima makluman tempahan.
      </div>
    );
  }

  if (status === "on") {
    return (
      <button
        type="button"
        onClick={disable}
        className="card-tap mb-5 flex w-full items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-left animate-fade-in"
      >
        <CheckCircleIcon filled className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="min-w-0 flex-1 text-xs font-medium text-emerald-400">Notifikasi tempahan aktif di peranti ini</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={enable}
      disabled={status === "busy"}
      className="card-tap mb-5 flex w-full items-center gap-2.5 rounded-2xl border border-brand-400/40 bg-[color:var(--surface-2)] px-4 py-3 text-left animate-fade-in disabled:opacity-60"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--surface-2)] text-brand-400">
        <BellIcon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[color:var(--text-primary)]">
          {status === "busy" ? "Menyediakan..." : "Aktifkan Notifikasi Tempahan"}
        </span>
        <span className="block text-xs text-[color:var(--text-secondary)]">Dapat makluman terus di peranti ini bila ada tempahan baru</span>
      </span>
    </button>
  );
}
