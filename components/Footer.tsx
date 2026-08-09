import Link from "next/link";
import { isAdminAuthed } from "@/lib/adminAuth";
import { LogOutIcon } from "@/components/icons";

export default function Footer() {
  const authed = isAdminAuthed();

  return (
    <div className="mt-6 flex flex-wrap animate-fade-in items-center justify-center gap-3 pb-8 text-xs">
      <Link href="/favorites" className="font-semibold" style={{ color: "var(--brand, #7a51c9)" }}>
        Kegemaran
      </Link>
      <span className="text-[color:var(--text-muted)]">&middot;</span>
      <Link href="/dashboard/login" className="font-semibold" style={{ color: "var(--brand, #7a51c9)" }}>
        Log Masuk
      </Link>
      <span className="text-[color:var(--text-muted)]">&middot;</span>
      <Link href="/dashboard/register" className="font-semibold" style={{ color: "var(--brand, #7a51c9)" }}>
        Daftar Terapis
      </Link>
      {authed && (
        <>
          <span className="text-[color:var(--text-muted)]">&middot;</span>
          <a href="/api/admin/logout" className="flex items-center gap-1 font-semibold text-[color:var(--text-muted)]">
            <LogOutIcon className="h-3 w-3" />
            Log Keluar
          </a>
        </>
      )}
    </div>
  );
}
