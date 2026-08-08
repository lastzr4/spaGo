import { NextRequest, NextResponse } from "next/server";
import { getTherapistByToken } from "@/lib/dashboard";
import { askClaude } from "@/lib/anthropic";

const MAX_INPUT_LENGTH = 1000;

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, MAX_INPUT_LENGTH) : "";
  if (!text) return NextResponse.json({ error: "EMPTY_TEXT" }, { status: 400 });

  const result = await askClaude({
    system: [
      "Anda membantu terapis urut mobile di Malaysia menulis bio profil yang menarik dan profesional untuk platform SpaGo.",
      "Tulis semula teks yang diberikan dalam Bahasa Melayu santai tapi profesional, 2-4 ayat sahaja.",
      "Kekalkan fakta asal (pengalaman, kepakaran, dll) sahaja — jangan tambah maklumat baru yang tidak dinyatakan pengguna.",
      "Jangan guna emoji berlebihan. Jangan tambah tanda petik di sekeliling jawapan, jangan tambah pengenalan seperti 'Berikut ialah'.",
    ].join("\n"),
    prompt: `Tulis semula bio terapis ini dengan lebih menarik:\n\n${text}`,
    maxTokens: 220,
  });

  if (!result) {
    return NextResponse.json({ error: "AI_ERROR" }, { status: 502 });
  }
  return NextResponse.json({ result });
}
