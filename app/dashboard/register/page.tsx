"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import SegmentedToggle from "@/components/SegmentedToggle";
import AreaPicker from "@/components/AreaPicker";

const ERROR_MESSAGES: Record<string, string> = {
  USERNAME_INVALID: "Username mesti 4-20 aksara (huruf, nombor, garis bawah sahaja).",
  USERNAME_TAKEN: "Username ini sudah digunakan. Sila pilih yang lain.",
  PIN_INVALID: "PIN mesti 4-6 digit nombor sahaja.",
};

export default function TherapistRegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"FEMALE" | "MALE" | "">("");
  const [clientGenderPolicy, setClientGenderPolicy] = useState<"FEMALE_ONLY" | "MALE_ONLY" | "BOTH">("FEMALE_ONLY");
  const [areas, setAreas] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleArea(a: string) {
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phone || !gender || areas.length === 0 || !username || !pin) {
      setError("Sila lengkapkan semua maklumat wajib.");
      return;
    }
    if (!/^[0-9]{4,6}$/.test(pin)) {
      setError("PIN mesti 4-6 digit nombor sahaja.");
      return;
    }
    if (pin !== pinConfirm) {
      setError("PIN tidak sepadan. Sila cuba lagi.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/therapists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Username doubles as the public display name — there's no separate
        // "Nama Penuh" field anymore (merged per request).
        body: JSON.stringify({ name: username, phone, gender, clientGenderPolicy, coverageAreas: areas, bio, username, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERROR_MESSAGES[data.error] ?? "Pendaftaran gagal. Sila cuba lagi.");
        setSubmitting(false);
        return;
      }
      router.push(`/dashboard/${data.therapist.dashboardToken}`);
    } catch {
      setError("Pendaftaran gagal. Sila cuba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <TopBar title="Daftar Terapis" backHref="/" />
      <main className="flex-1 overflow-y-auto px-5 py-6">
        <p className="mb-6 animate-fade-in text-sm text-[color:var(--text-secondary)]">
          Selepas daftar, anda boleh log masuk bila-bila masa dengan username &amp; PIN yang anda tetapkan di bawah.
        </p>

        <form onSubmit={handleSubmit} className="flex animate-fade-in flex-col gap-5">
          <div>
            <input
              className="input"
              placeholder="Username (4-20 aksara)"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              autoCapitalize="none"
              required
            />
            <p className="mt-1.5 text-xs text-[color:var(--text-muted)]">
              Ini akan jadi nama paparan awam anda juga (huruf, nombor, garis bawah sahaja — tiada ruang/spasi).
            </p>
          </div>

          <input className="input" placeholder="No. WhatsApp (cth: 0123456789)" value={phone} onChange={(e) => setPhone(e.target.value)} required />

          <div>
            <label className="mb-2 block text-sm font-semibold text-[color:var(--text-primary)]">Jantina anda</label>
            <SegmentedToggle
              options={[
                { value: "FEMALE" as const, label: "Wanita" },
                { value: "MALE" as const, label: "Lelaki" },
              ]}
              value={gender}
              onChange={setGender}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[color:var(--text-primary)]">Pelanggan yang diterima</label>
            <select className="input" value={clientGenderPolicy} onChange={(e) => setClientGenderPolicy(e.target.value as any)}>
              <option value="FEMALE_ONLY">Wanita sahaja</option>
              <option value="MALE_ONLY">Lelaki sahaja</option>
              <option value="BOTH">Lelaki & Wanita</option>
            </select>
            <p className="mt-1.5 text-xs text-[color:var(--text-muted)]">Nota: pelanggan lelaki hanya akan dipadankan dengan terapis lelaki (polisi keselamatan).</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[color:var(--text-primary)]">Kawasan liputan</label>
            <AreaPicker value={areas} onToggle={toggleArea} />
          </div>

          <textarea className="input" placeholder="Ringkasan pengalaman / kepakaran (optional)" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />

          <div className="rounded-2xl bg-[color:var(--surface-2)]/60 p-4">
            <p className="mb-3 text-sm font-semibold text-[color:var(--text-primary)]">PIN log masuk</p>
            <div className="flex gap-3">
              <input
                className="input"
                type="password"
                inputMode="numeric"
                placeholder="PIN (4-6 digit)"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
              <input
                className="input"
                type="password"
                inputMode="numeric"
                placeholder="Sahkan PIN"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </div>
            <p className="mt-2 text-xs text-[color:var(--text-secondary)]">Guna username &amp; PIN ini untuk log masuk ke dashboard anda kemudian.</p>
          </div>

          {error && <p className="rounded-xl bg-red-500/15 px-3.5 py-2.5 text-sm font-medium text-red-400">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Mendaftar..." : "Daftar"}
          </button>

          <p className="text-center text-sm text-[color:var(--text-secondary)]">
            Dah ada akaun?{" "}
            <Link href="/dashboard/login" className="font-semibold text-brand-600">
              Log masuk
            </Link>
          </p>
        </form>
      </main>
    </>
  );
}
