import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isMatch } from "@/lib/gender";
import TherapistCard from "@/components/TherapistCard";
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
          include: { services: { where: { active: true }, orderBy: { price: "asc" } } },
          orderBy: { createdAt: "desc" },
        })
      ).filter((t) => isMatch(gender, t.gender, t.clientGenderPolicy))
    : [];

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <Link href="/" className="mb-4 text-sm text-brand-600">&larr; Tukar carian</Link>
      <h1 className="text-xl font-semibold text-brand-900">
        Terapis di {area || "kawasan anda"}
      </h1>
      <p className="mb-6 mt-1 text-sm text-gray-500">
        {therapists.length} terapis sepadan dengan carian anda.
      </p>

      {therapists.length === 0 ? (
        <div className="card text-center text-sm text-gray-500">
          Tiada terapis tersedia di kawasan ini buat masa ini. Cuba kawasan lain atau kembali sebentar lagi.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {therapists.map((t) => (
            <TherapistCard
              key={t.id}
              area={area}
              gender={gender}
              therapist={{
                id: t.id,
                name: t.name,
                gender: t.gender,
                bio: t.bio,
                coverageAreas: t.coverageAreas,
                services: t.services.map((s) => ({
                  id: s.id,
                  name: s.name,
                  durationMinutes: s.durationMinutes,
                  price: s.price.toString(),
                })),
                priceFrom: t.services.length ? t.services[0].price.toString() : null,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
