import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMatch } from "@/lib/gender";
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
        photoUrl: s.photoUrl,
      })),
      priceFrom: t.services.length ? t.services[0].price : null,
    })),
  });
}

// POST /api/therapists - therapist self-registration
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, gender, clientGenderPolicy, coverageAreas, bio } = body ?? {};

  if (!name || !phone || !gender || !coverageAreas?.length) {
    return NextResponse.json({ error: "name, phone, gender, coverageAreas are required" }, { status: 400 });
  }
  if (gender !== "MALE" && gender !== "FEMALE") {
    return NextResponse.json({ error: "gender must be MALE or FEMALE" }, { status: 400 });
  }

  const therapist = await prisma.therapist.create({
    data: {
      name,
      phone,
      gender,
      clientGenderPolicy: clientGenderPolicy ?? "FEMALE_ONLY",
      coverageAreas,
      bio: bio ?? null,
    },
  });

  return NextResponse.json({ therapist }, { status: 201 });
}
