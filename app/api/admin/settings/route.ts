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

  if (!HEX_RE.test(themeColor ?? "") || !HEX_RE.test(backgroundColor ?? "")) {
    return NextResponse.json({ error: "INVALID_COLOR" }, { status: 400 });
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", themeColor, backgroundColor },
    update: { themeColor, backgroundColor },
  });

  return NextResponse.json({ settings });
}
