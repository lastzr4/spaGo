import Link from "next/link";
import AreaGenderForm from "@/components/AreaGenderForm";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-500">SpaGo</p>
        <h1 className="mt-1 text-2xl font-semibold text-brand-900">Urut rumah, ditempah terus</h1>
        <p className="mt-2 text-sm text-gray-500">
          Cari terapis mobile berhampiran anda, semak slot kosong secara langsung, dan tempah terus ke WhatsApp.
        </p>
      </div>

      <div className="card">
        <AreaGenderForm />
      </div>

      <div className="mt-8 flex items-center justify-between text-sm">
        <span className="text-gray-500">Terapis mobile spa?</span>
        <Link href="/dashboard/register" className="font-medium text-brand-600 underline underline-offset-2">
          Daftar sebagai terapis
        </Link>
      </div>
    </main>
  );
}
