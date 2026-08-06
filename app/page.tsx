import AreaGenderForm from "@/components/AreaGenderForm";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="safe-top flex flex-1 flex-col">
      <div
        className="relative overflow-hidden px-6 pb-14 pt-10 text-white"
        style={{ background: "linear-gradient(135deg, var(--brand, #7a51c9), color-mix(in srgb, var(--brand, #7a51c9) 55%, white))" }}
      >
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

        <Footer />
      </div>
    </main>
  );
}
