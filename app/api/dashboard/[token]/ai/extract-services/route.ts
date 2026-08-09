import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";
import { extractServicesFromDocument } from "@/lib/anthropic";

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"] as const;

// Reads an uploaded price-list image/PDF, asks Claude to extract structured
// service rows, then creates them directly (auto-save, no review step — the
// therapist can still edit/delete any row afterwards from Urus Servis as
// usual, same as any manually-added service).
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const dataUrl: string | undefined = body?.dataUrl;
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return NextResponse.json({ error: "dataUrl required" }, { status: 400 });
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Format fail tidak sah" }, { status: 400 });
  const [, mediaType, base64Data] = match;

  if (!(ALLOWED_MEDIA_TYPES as readonly string[]).includes(mediaType)) {
    return NextResponse.json({ error: "Jenis fail tidak disokong. Guna gambar (JPG/PNG) atau PDF." }, { status: 400 });
  }

  const extracted = await extractServicesFromDocument({
    base64Data,
    mediaType: mediaType as (typeof ALLOWED_MEDIA_TYPES)[number],
  });

  if (!extracted || extracted.length === 0) {
    return NextResponse.json(
      { error: "Tiada servis dikesan dalam dokumen ini. Sila cuba gambar/dokumen lain atau isi manual." },
      { status: 422 }
    );
  }

  const created = await Promise.all(
    extracted.map((s) =>
      prisma.service.create({
        data: {
          therapistId: therapist.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
          description: s.description,
        },
      })
    )
  );

  return NextResponse.json({ services: created });
}
