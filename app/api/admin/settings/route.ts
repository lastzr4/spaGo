import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getSiteSettings } from "@/lib/siteSettings";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const themeColor = body?.themeColor;
  const backgroundColor = body?.backgroundColor;
  const heroTitle = typeof body?.heroTitle === "string" ? body.heroTitle.slice(0, 120) : undefined;
  const heroSubtitle = typeof body?.heroSubtitle === "string" ? body.heroSubtitle.slice(0, 300) : undefined;
  // heroBackgroundImage: string (data URL) to set, "" / null to clear, undefined to leave unchanged
  const heroBackgroundImage =
    body?.heroBackgroundImage === null || body?.heroBackgroundImage === ""
      ? null
      : typeof body?.heroBackgroundImage === "string"
        ? body.heroBackgroundImage
        : undefined;
  // adminEmail: string to set, "" / null to clear, undefined to leave unchanged
  const adminEmail =
    body?.adminEmail === null || body?.adminEmail === ""
      ? null
      : typeof body?.adminEmail === "string"
        ? body.adminEmail.trim().slice(0, 200)
        : undefined;

  if (!HEX_RE.test(themeColor ?? "") || !HEX_RE.test(backgroundColor ?? "")) {
    return NextResponse.json({ error: "INVALID_COLOR" }, { status: 400 });
  }
  if (!heroTitle || !heroSubtitle) {
    return NextResponse.json({ error: "MISSING_HERO_TEXT" }, { status: 400 });
  }
  if (adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      themeColor,
      backgroundColor,
      heroTitle,
      heroSubtitle,
      heroBackgroundImage: heroBackgroundImage ?? null,
      adminEmail: adminEmail ?? null,
    },
    update: {
      themeColor,
      backgroundColor,
      heroTitle,
      heroSubtitle,
      ...(heroBackgroundImage !== undefined ? { heroBackgroundImage } : {}),
      ...(adminEmail !== undefined ? { adminEmail } : {}),
    },
  });

  return NextResponse.json({ settings });
}
