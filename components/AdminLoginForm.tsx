"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockIcon } from "@/components/icons";

export default function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setError("Username atau password salah.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="card w-full max-w-sm animate-pop-in">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--surface-2)] text-brand-300">
            <LockIcon className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold text-[color:var(--text-primary)]">SpaGo Admin</h1>
          <p className="text-sm text-[color:var(--text-secondary)]">Log masuk untuk urus tetapan laman.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p className="rounded-xl bg-red-500/15 px-3.5 py-2.5 text-sm font-medium text-red-400">{error}</p>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Log masuk..." : "Log Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
