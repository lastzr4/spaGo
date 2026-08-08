import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";
import { generateTemplateSlots, type WeeklyTemplate } from "@/lib/slotTemplate";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// PUT { template: { "0": ["09:00"], "1": ["09:00","14:00"], ... } } — keys are
// JS Date.getDay() weekdays (0=Ahad..6=Sabtu). Replaces the therapist's weekly
// template wholesale, then extends the rolling slot window to match it.
export async function PUT(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const raw = body?.template;
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ error: "TEMPLATE_REQUIRED" }, { status: 400 });
  }

  const template: WeeklyTemplate = {};
  for (const [weekday, times] of Object.entries(raw)) {
    if (!/^[0-6]$/.test(weekday) || !Array.isArray(times)) continue;
    const clean = times.filter((t): t is string => typeof t === "string" && TIME_RE.test(t));
    if (clean.length > 0) template[weekday] = clean;
  }

  await prisma.therapist.update({
    where: { id: therapist.id },
    data: { weeklyTemplate: template },
  });

  await generateTemplateSlots(therapist.id);

  return NextResponse.json({ template });
}
