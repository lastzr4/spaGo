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
    <header className="safe-top sticky top-0 z-20 flex items-center gap-2 border-b border-black/[0.04] bg-white/80 px-4 py-3 backdrop-blur-md">
      {backHref ? (
        <Link
          href={backHref}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
          style={{ background: "color-mix(in srgb, var(--brand, #7a51c9) 10%, white)", color: "var(--brand, #7a51c9)" }}
          aria-label="Kembali"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
      ) : (
        <span className="h-9 w-9 shrink-0" />
      )}
      <h1 className="flex-1 truncate text-center text-[15px] font-semibold text-brand-900">{title}</h1>
      <div className="flex min-w-9 shrink-0 items-center justify-end gap-1.5">{right}</div>
    </header>
  );
}
