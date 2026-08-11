"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, AppleShareIcon, PlusIcon, XIcon } from "@/components/icons";

// Chrome/Android fires this before showing its native install UI. We stash
// it so we can trigger the same native prompt later, from our own button —
// the event isn't typed in lib.dom.d.ts, hence the local interface.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "spago_install_dismissed";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"none" | "android" | "ios">("none");
  const [dismissed, setDismissed] = useState(true); // default hidden until checked, avoids flash

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return; // already installed, never show

    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
      setDismissed(false);
    }

    if (isIos) {
      // iOS Safari never fires beforeinstallprompt — show manual instructions instead.
      setPlatform("ios");
      setDismissed(false);
    } else {
      window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  if (dismissed || platform === "none") return null;

  return (
    <div className="relative mb-5 flex items-start gap-2.5 rounded-2xl border border-brand-400/40 bg-[color:var(--surface-2)] px-4 py-3 animate-fade-in">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--surface-2)] text-brand-400">
        {platform === "ios" ? <AppleShareIcon className="h-4 w-4" /> : <DownloadIcon className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[color:var(--text-primary)]">Pasang SpaGo di Skrin Utama</p>
        {platform === "ios" ? (
          <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">
            Tekan <AppleShareIcon className="inline h-3.5 w-3.5 align-[-3px]" /> Kongsi di bawah, kemudian pilih{" "}
            <span className="inline-flex items-center gap-0.5 font-medium text-[color:var(--text-primary)]">
              <PlusIcon className="h-3 w-3" /> Tambah ke Skrin Utama
            </span>
            .
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">Akses pantas macam aplikasi, tanpa buka pelayar setiap kali.</p>
        )}
        {platform === "android" && (
          <button type="button" onClick={install} className="mt-2 rounded-full bg-[color:var(--brand,#7a51c9)] px-3.5 py-1.5 text-xs font-semibold text-white active:scale-95">
            Pasang Sekarang
          </button>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label="Tutup" className="shrink-0 p-1 text-[color:var(--text-muted)]">
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
