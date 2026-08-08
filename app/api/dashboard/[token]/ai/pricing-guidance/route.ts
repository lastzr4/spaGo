import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";
import { askClaude } from "@/lib/anthropic";

// All the number-crunching here is plain deterministic stats — comparable
// services from other active therapists in overlapping coverage areas.
// AI is only used to phrase the result as a natural sentence; it never sees
// or invents the underlying numbers itself, so it can't hallucinate a price.
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const serviceId = typeof body?.serviceId === "string" ? body.serviceId : "";
  if (!serviceId) return NextResponse.json({ error: "MISSING_SERVICE" }, { status: 400 });

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || service.therapistId !== therapist.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (therapist.coverageAreas.length === 0) {
    return NextResponse.json({ error: "NO_AREAS" }, { status: 400 });
  }

  const others = await prisma.service.findMany({
    where: {
      active: true,
      therapistId: { not: therapist.id },
      therapist: { active: true, coverageAreas: { hasSome: therapist.coverageAreas } },
    },
    select: { name: true, price: true },
  });

  const targetName = service.name.trim().toLowerCase();
  const comparable = others.filter((s) => {
    const name = s.name.trim().toLowerCase();
    return name === targetName || name.includes(targetName) || targetName.includes(name);
  });

  if (comparable.length < 2) {
    return NextResponse.json({
      guidance: "Tidak cukup data servis serupa di kawasan liputan anda buat masa ini untuk perbandingan harga yang bermakna.",
      stats: null,
    });
  }

  const prices = comparable.map((s) => Number(s.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const myPrice = Number(service.price);

  const guidance = await askClaude({
    system: [
      "Anda memberi panduan harga ringkas kepada terapis urut mobile berdasarkan data statistik yang diberikan sahaja.",
      "Tulis SATU ayat pendek dalam Bahasa Melayu santai (maksimum 25 patah perkataan) membandingkan harga terapis dengan purata pasaran di kawasan mereka.",
      "Guna HANYA nombor yang diberikan — jangan reka atau ubah nombor.",
      "Nada neutral dan membantu, bukan menekan. Jangan tambah tanda petik atau pengenalan.",
    ].join("\n"),
    prompt: [
      `Servis: ${service.name}`,
      `Harga terapis ini: RM${myPrice.toFixed(0)}`,
      `Purata harga servis serupa di kawasan sama (${comparable.length} data): RM${avg.toFixed(0)}`,
      `Julat: RM${min.toFixed(0)} - RM${max.toFixed(0)}`,
    ].join("\n"),
    maxTokens: 100,
  });

  return NextResponse.json({
    guidance: guidance ?? `Purata harga servis serupa di kawasan anda ialah RM${avg.toFixed(0)} (julat RM${min.toFixed(0)}-RM${max.toFixed(0)}), berbanding harga anda RM${myPrice.toFixed(0)}.`,
    stats: { min, max, avg, count: comparable.length, myPrice },
  });
}
