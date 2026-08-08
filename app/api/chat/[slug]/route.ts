import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

// Free-trial + rate-limit constants for the public-facing FAQ widget.
// Feature is free for the therapist's first 30 days on SpaGo — after that
// it's gated off (no billing/paid-tier plumbing exists yet, so it's a hard
// stop, not a soft one).
const TRIAL_DAYS = 30;
const DAILY_MESSAGE_LIMIT = 40;
const MAX_MESSAGE_LENGTH = 300;
const MAX_HISTORY_TURNS = 6;

function todayStrMYT() {
  // Malaysia-local date string so the daily cap resets at MYT midnight, not
  // wherever the server happens to run.
  const myt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return myt.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const therapist = await prisma.therapist.findUnique({
    where: { slug: params.slug },
    include: { services: { where: { active: true }, orderBy: { price: "asc" } } },
  });

  if (!therapist || !therapist.active) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (!therapist.aiChatEnabled) {
    return NextResponse.json({ error: "DISABLED" }, { status: 403 });
  }

  const daysSinceCreated = Math.floor((Date.now() - therapist.createdAt.getTime()) / 86400000);
  if (daysSinceCreated > TRIAL_DAYS) {
    return NextResponse.json({ error: "TRIAL_ENDED" }, { status: 403 });
  }

  const client = getAnthropicClient();
  if (!client) {
    return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
  const rawHistory = Array.isArray(body?.history) ? body.history.slice(-MAX_HISTORY_TURNS) : [];

  if (!message) {
    return NextResponse.json({ error: "EMPTY_MESSAGE" }, { status: 400 });
  }

  const date = todayStrMYT();
  const usage = await prisma.chatUsage.findUnique({
    where: { therapistId_date: { therapistId: therapist.id, date } },
  });
  if (usage && usage.messageCount >= DAILY_MESSAGE_LIMIT) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const servicesLines =
    therapist.services.map((s) => `- ${s.name}: RM${Number(s.price).toFixed(0)} (${s.durationMinutes} minit)`).join("\n") ||
    "Belum ada servis disenaraikan.";

  const depositLine =
    therapist.depositRequired && therapist.depositAmount
      ? `Deposit RM${Number(therapist.depositAmount).toFixed(0)} diperlukan sebelum tempahan disahkan.`
      : "Tiada deposit diperlukan.";

  const systemPrompt = [
    `Anda adalah pembantu maya untuk ${therapist.name}, terapis urut mobile di SpaGo (Malaysia).`,
    `Jawab HANYA soalan berkaitan servis, harga, kawasan liputan, dan waktu operasi terapis ini, guna maklumat di bawah sahaja. Jangan reka maklumat yang tiada.`,
    `Jika ditanya perkara di luar skop ini (nasihat perubatan, topik tidak berkaitan, atau maklumat yang anda tiada), maklumkan anda tidak pasti dan cadangkan pelanggan tanya terus melalui WhatsApp.`,
    `Jangan proses tempahan sendiri — sentiasa arahkan pelanggan teruskan ke WhatsApp untuk tempah.`,
    `Balas dalam Bahasa Melayu santai, ringkas (2-4 ayat sahaja).`,
    ``,
    `Maklumat terapis:`,
    `Nama: ${therapist.name}`,
    `Kawasan liputan: ${therapist.coverageAreas.join(", ") || "Tidak dinyatakan"}`,
    `Waktu operasi: ${therapist.workingHoursNote || "Tidak dinyatakan"}`,
    `Bio: ${therapist.bio || "Tiada"}`,
    `Servis & harga:`,
    servicesLines,
    depositLine,
  ].join("\n");

  try {
    const history = rawHistory
      .filter((h: any) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
      .map((h: any) => ({ role: h.role as "user" | "assistant", content: String(h.content).slice(0, MAX_MESSAGE_LENGTH) }));

    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 300,
      system: systemPrompt,
      messages: [...history, { role: "user", content: message }],
    });

    const reply = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    await prisma.chatUsage.upsert({
      where: { therapistId_date: { therapistId: therapist.id, date } },
      update: { messageCount: { increment: 1 } },
      create: { therapistId: therapist.id, date, messageCount: 1 },
    });

    const remaining = Math.max(0, DAILY_MESSAGE_LIMIT - ((usage?.messageCount ?? 0) + 1));

    return NextResponse.json({
      reply: reply || "Maaf, saya tak pasti. Sila tanya terus melalui WhatsApp ya.",
      remaining,
    });
  } catch {
    return NextResponse.json({ error: "AI_ERROR" }, { status: 502 });
  }
}
