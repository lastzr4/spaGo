"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import PinPadInput from "@/components/PinPadInput";
import { LockIcon } from "@/components/icons";

export default function TherapistLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pinPadOpen, setPinPadOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/therapist-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Username atau PIN salah.");
        setSubmitting(false);
        return;
      }
      router.push(`/dashboard/${data.dashboardToken}`);
    } catch {
      setError("Log masuk gagal. Sila cuba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <TopBar title="Log Masuk Terapis" backHref="/" />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="card w-full max-w-sm animate-pop-in">
          <div className="mb-5 flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <LockIcon className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold text-brand-900">Log Masuk</h1>
            <p className="text-sm text-gray-500">Masukkan username &amp; PIN dashboard anda.</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              className="input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              autoCapitalize="none"
              required
            />
            <PinPadInput
              value={pin}
              onChange={setPin}
              open={pinPadOpen}
              onOpenChange={setPinPadOpen}
              label="Masukkan PIN"
              placeholder="PIN"
            />
            {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{error}</p>}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Log masuk..." : "Log Masuk"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Belum daftar?{" "}
            <Link href="/dashboard/register" className="font-semibold text-brand-600">
              Daftar sebagai terapis
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
