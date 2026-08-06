import { prisma } from "@/lib/prisma";
import { isMatch } from "@/lib/gender";
import TherapistCard from "@/components/TherapistCard";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import type { Gender } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function TherapistsPage({
  searchParams,
}: {
  searchParams: { area?: string; gender?: string };
}) {
  const area = searchParams.area ?? "";
  const gender = (searchParams.gender as Gender) ?? "FEMALE";

  const therapists = area
    ? (
        await prisma.therapist.findMany({
          where: { active: true, coverageAreas: { has: area } },
          include: {
            services: { where: { active: true }, orderBy: { price: "asc" } },
            reviews: { where: { hidden: false }, select: { rating: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      ).filter((t) => isMatch(gender, t.gender, t.clientGenderPolicy))
    : [];

  return (
    <>
      <TopBar title={area || "Terapis"} backHref="/" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <p className="mb-5 animate-fade-in text-sm text-gray-500">
          {therapists.length} terapis sepadan dengan carian anda.
        </p>

        {therapists.length === 0 ? (
          <div className="card flex flex-col items-center gap-1 py-10 text-center animate-fade-in">
            <p className="text-sm font-medium text-gray-600">Tiada terapis di kawasan ini</p>
            <p className="text-xs text-gray-400">Cuba kawasan lain atau kembali sebentar lagi.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {therapists.map((t, i) => {
              const reviewCount = t.reviews.length;
              const averageRating =
                reviewCount > 0 ? t.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : null;
              return (
                <div key={t.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <TherapistCard
                    area={area}
                    gender={gender}
                    therapist={{
                      id: t.id,
                      name: t.name,
                      gender: t.gender,
                      bio: t.bio,
                      photoUrl: t.photoUrl,
                      coverageAreas: t.coverageAreas,
                      services: t.services.map((s) => ({
                        id: s.id,
                        name: s.name,
                        durationMinutes: s.durationMinutes,
                        price: s.price.toString(),
                      })),
                      priceFrom: t.services.length ? t.services[0].price.toString() : null,
                      averageRating,
                      reviewCount,
                      depositRequired: t.depositRequired,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
        <Footer />
      </main>
    </>
  );
}
