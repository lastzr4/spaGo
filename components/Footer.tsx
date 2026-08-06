import Link from "next/link";
import { isAdminAuthed } from "@/lib/adminAuth";
import { LogOutIcon } from "@/components/icons";

export default function Footer() {
  const authed = isAdminAuthed();

  return (
    <div className="mt-6 flex animate-fade-in items-center justify-center gap-3 pb-8 text-xs">
      <Link href="/dashboard/login" className="font-semibold" style={{ color: "var(--brand, #7a51c9)" }}>
        Log Masuk
      </Link>
      <span className="text-gray-300">&middot;</span>
      <Link href="/dashboard/register" className="font-semibold" style={{ color: "var(--brand, #7a51c9)" }}>
        Daftar Terapis
      </Link>
      {authed && (
        <>
          <span className="text-gray-300">&middot;</span>
          <a href="/api/admin/logout" className="flex items-center gap-1 font-semibold text-gray-400">
            <LogOutIcon className="h-3 w-3" />
            Log Keluar
          </a>
        </>
      )}
    </div>
  );
}
