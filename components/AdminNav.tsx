"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon } from "@/components/icons";

const TABS = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/therapists", label: "Terapis" },
  { href: "/admin/settings", label: "Tetapan" },
  { href: "/admin/demo", label: "Demo" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="safe-top sticky top-0 z-20 border-b border-[color:var(--border)] bg-[rgba(26,18,48,0.9)] px-5 pt-3 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[color:var(--text-primary)]">SpaGo Admin</h1>
        <a href="/api/admin/logout" className="btn-ghost flex items-center gap-1 bg-[color:var(--surface-2)] px-3 py-1.5 text-xs">
          <LogOutIcon className="h-3.5 w-3.5" />
          Log Keluar
        </a>
      </div>
      <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-3">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`chip shrink-0 ${active ? "chip-active" : ""}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
