import { prisma } from "@/lib/prisma";

// How many days ahead the rolling window keeps filled.
export const TEMPLATE_WINDOW_DAYS = 14;

// Keyed by JS Date.getDay() as a string: "0" = Ahad ... "6" = Sabtu.
export type WeeklyTemplate = Record<string, string[]>;

function toDateOnly(d: Date) {
  return new Date(d.toISOString().slice(0, 10));
}

function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function endTimeFor(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Extends a therapist's template-generated slots forward to cover a rolling window.
// Uses a watermark (templateGeneratedUntil) so it only ever fills NEW dates going
// forward — it never re-touches a date it already generated once, so a slot the
// therapist manually deletes stays deleted (it won't be resurrected on next visit).
export async function generateTemplateSlots(therapistId: string) {
  const therapist = await prisma.therapist.findUnique({
    where: { id: therapistId },
    select: { weeklyTemplate: true, templateGeneratedUntil: true },
  });
  if (!therapist?.weeklyTemplate) return;

  const template = therapist.weeklyTemplate as WeeklyTemplate;
  const today = toDateOnly(new Date());
  const targetEnd = addDays(today, TEMPLATE_WINDOW_DAYS);

  const watermark = therapist.templateGeneratedUntil ? toDateOnly(therapist.templateGeneratedUntil) : null;
  const start = watermark && watermark >= today ? addDays(watermark, 1) : today;

  if (start > targetEnd) return; // window already fully generated

  const ops = [];
  for (let d = new Date(start); d <= targetEnd; d = addDays(d, 1)) {
    const times = template[String(d.getDay())];
    if (!times || times.length === 0) continue;
    for (const t of times) {
      ops.push(
        prisma.slot.upsert({
          where: { therapistId_date_startTime: { therapistId, date: d, startTime: t } },
          update: {},
          create: { therapistId, date: new Date(d), startTime: t, endTime: endTimeFor(t), status: "AVAILABLE" },
        })
      );
    }
  }

  if (ops.length > 0) await prisma.$transaction(ops);
  await prisma.therapist.update({ where: { id: therapistId }, data: { templateGeneratedUntil: targetEnd } });
}
