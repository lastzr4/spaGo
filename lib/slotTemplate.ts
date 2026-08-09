import { prisma } from "@/lib/prisma";

// How many days ahead the rolling window keeps filled.
export const TEMPLATE_WINDOW_DAYS = 14;

// Keyed by JS Date.getDay() as a string: "0" = Ahad ... "6" = Sabtu.
export type WeeklyTemplate = Record<string, string[]>;

// Malaysia is a fixed UTC+8 offset (no DST). Dates here are normalized to a
// UTC-midnight Date representing the correct Malaysia calendar day, then all
// further math uses the UTC getters/setters — this stays correct regardless of
// the server's own runtime timezone (Railway isn't guaranteed to run in MYT).
function toDateOnly(d: Date) {
  const my = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return new Date(Date.UTC(my.getUTCFullYear(), my.getUTCMonth(), my.getUTCDate()));
}

function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}

function endTimeFor(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
    const times = template[String(d.getUTCDay())];
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
