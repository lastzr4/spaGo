import Link from "next/link";
import AreaGenderForm from "@/components/AreaGenderForm";

export default function HomePage() {
  return (
    <main className="safe-top flex flex-1 flex-col">
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 px-6 pb-14 pt-10 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative animate-fade-in">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
            SpaGo
          </span>
          <h1 className="mt-3 text-[28px] font-bold leading-tight">
            Urut rumah,
            <br /> ditempah terus.
          </h1>
          <p className="mt-2 max-w-[280px] text-sm text-white/85">
            Cari terapis mobile berhampiran anda dan tempah terus ke WhatsApp — tanpa PM, tanpa tunggu.
          </p>
        </div>
      </div>

      <div className="relative -mt-8 flex-1 px-5">
        <div className="card animate-pop-in shadow-card-hover">
          <AreaGenderForm />
        </div>

        <div className="mt-6 flex animate-fade-in items-center justify-center gap-1.5 pb-8 text-sm">
          <span className="text-gray-500">Terapis mobile spa?</span>
          <Link href="/dashboard/register" className="font-semibold text-brand-600 underline-offset-2 active:underline">
            Daftar sebagai terapis
          </Link>
        </div>
      </div>
    </main>
  );
}
