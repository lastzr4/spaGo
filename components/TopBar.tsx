import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

export default function TopBar({
  title,
  backHref,
  right,
}: {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="safe-top sticky top-0 z-20 flex items-center gap-2 border-b border-[color:var(--border)] bg-[rgba(26,18,48,0.8)] px-4 py-3 backdrop-blur-md">
      {backHref ? (
        <Link
          href={backHref}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
          style={{ background: "color-mix(in srgb, var(--brand, #7a51c9) 18%, var(--surface-2))", color: "var(--brand, #7a51c9)" }}
          aria-label="Kembali"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="SpaGo" className="h-9 w-9 rounded-[10px]" />
        </span>
      )}
      <h1 className="flex-1 truncate text-center text-[15px] font-semibold text-[color:var(--text-primary)]">{title}</h1>
      <div className="flex min-w-9 shrink-0 items-center justify-end gap-1.5">{right}</div>
    </header>
  );
}
