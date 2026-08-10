import AreaGenderForm from "@/components/AreaGenderForm";
import Footer from "@/components/Footer";
import { getSiteSettings } from "@/lib/siteSettings";
import { Liquid } from "@/components/canvasui/Liquid";
import { ParticleReveal } from "@/components/canvasui/ParticleReveal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSiteSettings();

  const heroStyle = settings.heroBackgroundImage
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(20,10,35,0.35), rgba(20,10,35,0.55)), url(${settings.heroBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: "linear-gradient(135deg, var(--brand, #7a51c9), color-mix(in srgb, var(--brand, #7a51c9) 55%, white))",
      };

  return (
    <main className="safe-top flex flex-1 flex-col">
      <div className="relative overflow-hidden px-6 pb-14 pt-10 text-white" style={heroStyle}>
        {!settings.heroBackgroundImage && (
          <>
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/10" />
          </>
        )}
        {/* Liquid needs a floor height to lay out against (see Liquid.tsx
            comment) — 200px comfortably fits the badge + title + subtitle at
            their default length, and grows if admin-edited text runs long. */}
        <Liquid
          className="relative animate-fade-in"
          style={{ minHeight: 200 }}
          color={[0.48, 0.32, 0.79]}
          intensity={2.4}
          distortion={0.5}
          blend={6}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" className="h-4 w-4 shrink-0 rounded-[5px]" />
            SpaGo
          </span>
          <h1 className="mt-3 whitespace-pre-line text-[28px] font-bold leading-tight">{settings.heroTitle}</h1>
          <p className="mt-2 max-w-[280px] text-sm text-white/85">{settings.heroSubtitle}</p>
        </Liquid>
      </div>

      <div className="relative -mt-8 flex-1 px-5">
        <div className="card animate-pop-in shadow-card-hover">
          {/* Same minHeight requirement as Liquid above — see
              ParticleReveal.tsx comment. background="#ffffff" matches the
              .card's own bg-[color:var(--surface-2)] so the effect can tell form content apart
              from empty card padding. Smaller radius than the library default
              (500px) since this card is a small mobile-width element. */}
          <ParticleReveal background="#ffffff" radius={170} scatter={18} smoothing={0.2} style={{ minHeight: 220 }}>
            <AreaGenderForm />
          </ParticleReveal>
        </div>

        <Footer />
      </div>
    </main>
  );
}
