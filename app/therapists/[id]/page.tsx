import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingFlow from "@/components/BookingFlow";
import ReviewSection from "@/components/ReviewSection";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import SocialLinks from "@/components/SocialLinks";
import TherapistExtras from "@/components/TherapistExtras";
import TherapistBadges from "@/components/TherapistBadges";
import ShareButton from "@/components/ShareButton";
import FavoriteButton from "@/components/FavoriteButton";
import QuickInfoRow from "@/components/QuickInfoRow";
import { StarIcon, MapPinIcon, QrIcon, CashIcon, SparkleIcon, AwardIcon, ClockIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function TherapistDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { area?: string; gender?: string };
}) {
  const therapist = await prisma.therapist.findUnique({
    where: { id: params.id },
    include: { services: { where: { active: true }, orderBy: { price: "asc" } } },
  });

  if (!therapist || !therapist.active) notFound();

  const today = new Date();
  const twoWeeksOut = new Date();
  twoWeeksOut.setDate(today.getDate() + 14);

  const slots = await prisma.slot.findMany({
    where: {
      therapistId: therapist.id,
      status: "AVAILABLE",
      date: { gte: today, lte: twoWeeksOut },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const customerGender = (searchParams.gender as "MALE" | "FEMALE") ?? "FEMALE";

  const reviews = await prisma.review.findMany({
    where: { therapistId: therapist.id, hidden: false },
    orderBy: { createdAt: "desc" },
  });
  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
  const hasSocial = Boolean(therapist.socialInstagram || therapist.socialTiktok || therapist.socialThreads || therapist.socialX);

  return (
    <>
      <TopBar
        title={therapist.name}
        backHref={`/therapists?area=${encodeURIComponent(searchParams.area ?? "")}&gender=${customerGender}`}
        right={
          <>
            <FavoriteButton
              therapist={{
                id: therapist.id,
                name: therapist.name,
                gender: therapist.gender,
                photoUrl: therapist.photoUrl,
                coverageAreas: therapist.coverageAreas,
                priceFrom: therapist.services[0]?.price.toString() ?? null,
                slug: therapist.slug,
              }}
            />
            <ShareButton title={therapist.name} url={typeof window !== "undefined" ? window.location.href : ""} />
          </>
        }
      />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        {/* Large hero photo (Spafy-style) with floating rating + status badges,
            followed by name/location, a quick-info amenities row, and the AI
            review summary — replaces the old small-avatar horizontal card. */}
        <div className="mb-6 animate-fade-in">
          <div className="relative overflow-hidden rounded-3xl" style={{ aspectRatio: "4 / 3" }}>
            {therapist.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={therapist.photoUrl} alt={therapist.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-6xl font-bold text-white">
                {therapist.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            {average !== null && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-md">
                <StarIcon filled className="h-3 w-3 text-yellow-400" />
                {average.toFixed(1)}
                <span className="font-normal text-white/70">({reviews.length})</span>
              </span>
            )}
            <div className="absolute bottom-3 left-3">
              <TherapistBadges averageRating={average} reviewCount={reviews.length} createdAt={therapist.createdAt.toISOString()} />
            </div>
          </div>

          <div className="mt-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-[color:var(--text-primary)]">{therapist.name}</h1>
              <p className="mt-0.5 flex items-center gap-1 text-[13px] text-[color:var(--text-secondary)]">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{therapist.coverageAreas.join(", ")}</span>
              </p>
            </div>
          </div>

          <div className="mt-3">
            <QuickInfoRow
              items={[
                {
                  icon: <AwardIcon className="h-4 w-4" />,
                  label: "Pengalaman",
                  value: therapist.yearsExperience != null ? `${therapist.yearsExperience} thn` : "-",
                },
                {
                  icon: therapist.paymentMethod === "CASH" ? <CashIcon className="h-4 w-4" /> : <QrIcon className="h-4 w-4" />,
                  label: "Deposit",
                  value:
                    therapist.depositRequired && therapist.depositAmount
                      ? `RM${Number(therapist.depositAmount).toFixed(0)}`
                      : "Tiada",
                },
                {
                  icon: <ClockIcon className="h-4 w-4" />,
                  label: "Waktu",
                  value: therapist.workingHoursNote || "Fleksibel",
                },
              ]}
            />
          </div>

          {therapist.reviewSummary && (
            <p className="mt-3 flex items-start gap-1.5 rounded-2xl bg-[color:var(--surface-2)]/60 px-3.5 py-3 text-[12.5px] italic leading-relaxed text-[color:var(--text-secondary)]">
              <SparkleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
              &ldquo;{therapist.reviewSummary}&rdquo;
            </p>
          )}
        </div>

        {hasSocial && (
          <div className="mb-6 animate-fade-in">
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-[color:var(--text-muted)]">Ikuti</h2>
            <SocialLinks
              instagram={therapist.socialInstagram}
              tiktok={therapist.socialTiktok}
              threads={therapist.socialThreads}
              x={therapist.socialX}
            />
          </div>
        )}

        <TherapistExtras
          specialties={therapist.specialties}
          yearsExperience={therapist.yearsExperience}
          workingHoursNote={therapist.workingHoursNote}
          galleryPhotos={therapist.galleryPhotos}
        />

        {therapist.bio && (
          <p className="mb-6 animate-fade-in rounded-2xl bg-[color:var(--surface-2)]/60 px-4 py-3 text-[13px] leading-relaxed text-[color:var(--text-secondary)]">
            {therapist.bio}
          </p>
        )}

        <div className="animate-fade-in">
          <BookingFlow
            therapistId={therapist.id}
            therapistPhone={therapist.phone}
            therapistRating={average}
            therapistReviewCount={reviews.length}
            customerGender={customerGender}
            services={therapist.services.map((s) => ({
              id: s.id,
              name: s.name,
              durationMinutes: s.durationMinutes,
              price: s.price.toString(),
              photoUrl: s.photoUrl,
              description: s.description,
            }))}
            slots={slots.map((s) => ({
              id: s.id,
              date: s.date.toISOString(),
              startTime: s.startTime,
              endTime: s.endTime,
            }))}
            depositRequired={therapist.depositRequired}
            depositAmount={therapist.depositAmount ? therapist.depositAmount.toString() : null}
            paymentMethod={therapist.paymentMethod}
            qrCodeUrl={therapist.qrCodeUrl}
            extraChargesNote={therapist.extraChargesNote}
          />
        </div>

        <div className="mt-8 animate-fade-in border-t border-[color:var(--border)] pt-6">
          <ReviewSection
            therapistId={therapist.id}
            initialReviews={reviews.map((r) => ({
              id: r.id,
              customerName: r.customerName,
              rating: r.rating,
              comment: r.comment,
              createdAt: r.createdAt.toISOString(),
            }))}
            initialAverage={average}
          />
        </div>
        <Footer />
      </main>
    </>
  );
}
