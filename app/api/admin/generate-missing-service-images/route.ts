import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/adminAuth";
import { generateServiceImage } from "@/lib/gemini";

// POST /api/admin/generate-missing-service-images — one-shot platform-wide
// backfill: finds every service/package (across every therapist) that has
// no photo yet and generates one via Gemini, same default-AI-photo policy
// as new services get automatically going forward (see ServiceManager's
// auto-generate effect). Runs sequentially with a short stagger between
// calls rather than in parallel — deliberately slower, but avoids bursting
// past Gemini's rate limits when backfilling a platform with many
// therapists at once. A therapist's own manually-uploaded photo always
// takes precedence and is never touched by this route.
export async function POST() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const services = await prisma.service.findMany({
    where: { photoUrl: null },
    select: { id: true, name: true, description: true, isPackage: true },
  });

  let generated = 0;
  let failed = 0;
  for (const service of services) {
    const photoUrl = await generateServiceImage({
      serviceName: service.name,
      description: service.description,
      isPackage: service.isPackage,
    });
    if (photoUrl) {
      await prisma.service.update({ where: { id: service.id }, data: { photoUrl } });
      generated++;
    } else {
      failed++;
    }
    // Small stagger between calls — this route can process a lot of
    // services in one request, no need to hammer Gemini back-to-back.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return NextResponse.json({ total: services.length, generated, failed });
}
