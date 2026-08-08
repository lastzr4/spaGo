import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";
import { askClaude } from "@/lib/anthropic";

// Therapist-triggered (not auto-run per pageview) so cost stays bounded —
// regenerate on demand from the reviews dashboard page, cached on the
// Therapist row until regenerated again.
export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reviews = await prisma.review.findMany({
    where: { therapistId: therapist.id, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  if (reviews.length === 0) {
    return NextResponse.json({ error: "NO_REVIEWS" }, { status: 400 });
  }

  const reviewLines = reviews
    .map((r) => `- ${r.rating}/5${r.comment ? `: ${r.comment}` : " (tiada komen)"}`)
    .join("\n");

  const summary = await askClaude({
    system: [
      "Anda meringkaskan ulasan pelanggan untuk profil terapis urut mobile di platform SpaGo (Malaysia).",
      "Tulis SATU ayat pendek (maksimum 20 patah perkataan) dalam Bahasa Melayu yang menangkap tema utama ulasan.",
      "Fokus pada perkara positif yang kerap disebut (cth: ketepatan masa, teknik, keselesaan) jika ada.",
      "Jika ada kritikan berulang, boleh sebut secara neutral tanpa terlalu negatif.",
      "Jangan reka fakta yang tiada dalam ulasan. Jangan guna tanda petik atau pengenalan seperti 'Ringkasan:'.",
    ].join("\n"),
    prompt: `Ulasan pelanggan:\n${reviewLines}`,
    maxTokens: 100,
  });

  if (!summary) {
    return NextResponse.json({ error: "AI_ERROR" }, { status: 502 });
  }

  const updated = await prisma.therapist.update({
    where: { id: therapist.id },
    data: { reviewSummary: summary, reviewSummaryUpdatedAt: new Date() },
  });

  return NextResponse.json({ summary: updated.reviewSummary, updatedAt: updated.reviewSummaryUpdatedAt });
}
