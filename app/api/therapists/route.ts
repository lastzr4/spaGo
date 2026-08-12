import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMatch } from "@/lib/gender";
import { generateUniqueSlug } from "@/lib/slug";
import { hashPin, isValidUsername, isValidPin } from "@/lib/pin";
import { getSiteSettings } from "@/lib/siteSettings";
import { sendEmail } from "@/lib/email";
import { getEffectivePrice } from "@/lib/pricing";
import type { Gender } from "@prisma/client";

// GET /api/therapists?area=Bangi&gender=FEMALE
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const area = searchParams.get("area");
  const gender = searchParams.get("gender") as Gender | null;

  if (!area || !gender || (gender !== "MALE" && gender !== "FEMALE")) {
    return NextResponse.json({ error: "area and gender (MALE|FEMALE) are required" }, { status: 400 });
  }

  const therapists = await prisma.therapist.findMany({
    where: { active: true, coverageAreas: { has: area } },
    include: {
      services: { where: { active: true }, orderBy: { price: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = therapists.filter((t) => isMatch(gender, t.gender, t.clientGenderPolicy));

  return NextResponse.json({
    therapists: filtered.map((t) => ({
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
        price: s.price,
        promoPrice: s.promoPrice,
        badge: s.badge,
        photoUrl: s.photoUrl,
      })),
      priceFrom: t.services.length
        ? Math.min(...t.services.map((s) => getEffectivePrice(s.price.toString(), s.promoPrice?.toString() ?? null)))
        : null,
    })),
  });
}

// POST /api/therapists - therapist self-registration
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, gender, clientGenderPolicy, coverageAreas, bio, username, pin } = body ?? {};

  if (!name || !phone || !gender || !coverageAreas?.length || !username || !pin) {
    return NextResponse.json(
      { error: "name, phone, gender, coverageAreas, username, pin are required" },
      { status: 400 }
    );
  }
  if (gender !== "MALE" && gender !== "FEMALE") {
    return NextResponse.json({ error: "gender must be MALE or FEMALE" }, { status: 400 });
  }
  if (!isValidUsername(username)) {
    return NextResponse.json({ error: "USERNAME_INVALID" }, { status: 400 });
  }
  if (!isValidPin(pin)) {
    return NextResponse.json({ error: "PIN_INVALID" }, { status: 400 });
  }

  const existingUsername = await prisma.therapist.findUnique({ where: { username }, select: { id: true } });
  if (existingUsername) {
    return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
  }

  const slug = await generateUniqueSlug(name);
  const pinHash = hashPin(pin);

  const therapist = await prisma.therapist.create({
    data: {
      name,
      phone,
      gender,
      slug,
      username,
      pinHash,
      clientGenderPolicy: clientGenderPolicy ?? "FEMALE_ONLY",
      coverageAreas,
      bio: bio ?? null,
    },
  });

  // Notify admin, if an email is configured — fails open, never blocks registration.
  const { adminEmail } = await getSiteSettings();
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `SpaGo: Terapis baru daftar — ${therapist.name}`,
      html: `
        <div style="font-family: sans-serif; font-size: 14px; color: #1f1530; line-height: 1.6;">
          <h2 style="margin: 0 0 12px;">Pendaftaran terapis baru</h2>
          <p><strong>Nama / Username:</strong> ${therapist.name}</p>
          <p><strong>Telefon:</strong> ${therapist.phone}</p>
          <p><strong>Jantina:</strong> ${therapist.gender === "MALE" ? "Lelaki" : "Wanita"}</p>
          <p><strong>Kawasan liputan:</strong> ${therapist.coverageAreas.join(", ")}</p>
          <p style="margin-top: 16px;">
            <a href="https://spago.up.railway.app/admin/therapists" style="color: #7a51c9;">Lihat di SpaGo Admin</a>
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({ therapist }, { status: 201 });
}
