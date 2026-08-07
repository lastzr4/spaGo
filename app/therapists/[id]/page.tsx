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
import { StarIcon, MapPinIcon, QrIcon, CashIcon } from "@/components/icons";

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
        <div className="mb-5 flex animate-fade-in items-center gap-4">
          {therapist.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={therapist.photoUrl} alt={therapist.name} className="avatar-ring h-20 w-20 shrink-0 rounded-3xl object-cover" />
          ) : (
            <div className="avatar-ring flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-bold text-white">
              {therapist.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-brand-900">{therapist.name}</h1>
            <p className="mt-0.5 flex items-center gap-1 text-[13px] text-gray-500">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{therapist.coverageAreas.join(", ")}</span>
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <TherapistBadges averageRating={average} reviewCount={reviews.length} createdAt={therapist.createdAt.toISOString()} />
              {average !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[12px] font-semibold text-yellow-600">
                  <StarIcon filled className="h-3 w-3" />
                  {average.toFixed(1)}
                  <span className="font-normal text-yellow-500/70">({reviews.length} ulasan)</span>
                </span>
              )}
              {therapist.depositRequired && therapist.depositAmount ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-600">
                  {therapist.paymentMethod === "CASH" ? <CashIcon className="h-3 w-3" /> : <QrIcon className="h-3 w-3" />}
                  Deposit RM{Number(therapist.depositAmount).toFixed(0)} &middot; {therapist.paymentMethod === "CASH" ? "Tunai" : "QR"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-400">
                  Tiada deposit diperlukan
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-3 animate-fade-in">
          <SocialLinks
            instagram={therapist.socialInstagram}
            tiktok={therapist.socialTiktok}
            threads={therapist.socialThreads}
            x={therapist.socialX}
          />
        </div>

        <TherapistExtras
          specialties={therapist.specialties}
          yearsExperience={therapist.yearsExperience}
          workingHoursNote={therapist.workingHoursNote}
          galleryPhotos={therapist.galleryPhotos}
        />

        {therapist.bio && (
          <p className="mb-5 animate-fade-in rounded-2xl bg-brand-50/60 px-4 py-3 text-[13px] leading-relaxed text-gray-600">
            {therapist.bio}
          </p>
        )}

        <div className="animate-fade-in">
          <BookingFlow
            therapistId={therapist.id}
            therapistPhone={therapist.phone}
            customerGender={customerGender}
            services={therapist.services.map((s) => ({
              id: s.id,
              name: s.name,
              durationMinutes: s.durationMinutes,
              price: s.price.toString(),
              photoUrl: s.photoUrl,
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

        <div className="mt-8 animate-fade-in border-t border-black/[0.05] pt-6">
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
