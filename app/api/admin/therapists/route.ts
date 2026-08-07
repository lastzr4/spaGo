import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/adminAuth";
import { generateUniqueSlug } from "@/lib/slug";

export async function GET() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const therapists = await prisma.therapist.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { bookings: true, reviews: true } },
    },
  });

  return NextResponse.json({
    therapists: therapists.map((t) => ({
      id: t.id,
      name: t.name,
      phone: t.phone,
      gender: t.gender,
      coverageAreas: t.coverageAreas,
      active: t.active,
      isDemo: t.isDemo,
      dashboardToken: t.dashboardToken,
      bookingCount: t._count.bookings,
      reviewCount: t._count.reviews,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { name, phone, gender, clientGenderPolicy, coverageAreas, bio } = body ?? {};

  if (!name || !phone || !gender || !coverageAreas?.length) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }
  if (gender !== "MALE" && gender !== "FEMALE") {
    return NextResponse.json({ error: "GENDER_INVALID" }, { status: 400 });
  }

  const slug = await generateUniqueSlug(name);

  const therapist = await prisma.therapist.create({
    data: {
      name,
      phone,
      gender,
      slug,
      clientGenderPolicy: clientGenderPolicy ?? "FEMALE_ONLY",
      coverageAreas,
      bio: bio ?? null,
    },
  });

  return NextResponse.json({ therapist }, { status: 201 });
}
