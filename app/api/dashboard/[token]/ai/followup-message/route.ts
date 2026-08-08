import { NextRequest, NextResponse } from "next/server";
import { getTherapistByToken } from "@/lib/dashboard";
import { askClaude } from "@/lib/anthropic";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const customerName = typeof body?.customerName === "string" ? body.customerName.slice(0, 80) : "";
  const lastServiceName = typeof body?.lastServiceName === "string" ? body.lastServiceName.slice(0, 80) : "";
  const daysSinceLast = typeof body?.daysSinceLast === "number" ? body.daysSinceLast : null;
  const note = typeof body?.note === "string" ? body.note.slice(0, 300) : "";
  const referralCode = typeof body?.referralCode === "string" ? body.referralCode.slice(0, 20) : "";

  if (!customerName) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const promptLines = [
    `Nama pelanggan: ${customerName}`,
    `Nama terapis: ${therapist.name}`,
    lastServiceName ? `Servis terakhir ditempah: ${lastServiceName}` : null,
    daysSinceLast !== null ? `Sudah ${daysSinceLast} hari sejak tempahan terakhir` : null,
    note ? `Nota peribadi tentang pelanggan ini: ${note}` : null,
    referralCode ? `Kod rujukan untuk dikongsi: ${referralCode}` : null,
  ].filter(Boolean).join("\n");

  const message = await askClaude({
    system: [
      "Anda menulis draf mesej WhatsApp pendek bagi pihak terapis urut mobile, untuk dihantar kepada pelanggan lama yang sudah lama tidak menempah semula.",
      "Nada mesra dan santai, TIDAK memaksa atau over-salesy. 3-4 ayat sahaja.",
      "Jika ada nota peribadi tentang pelanggan, boleh selitkan secara halus (cth: sebut jenis urutan yang mereka suka) — tapi jangan bunyi pelik atau seperti mengintip.",
      "Jika ada kod rujukan, sebut secara ringkas di hujung mesej sebagai bonus untuk bawa kawan.",
      "Tulis dalam Bahasa Melayu santai. Jangan guna tanda petik di sekeliling jawapan. Jangan tambah pengenalan seperti 'Berikut ialah mesej:'.",
    ].join("\n"),
    prompt: promptLines,
    maxTokens: 220,
  });

  if (!message) {
    return NextResponse.json({ error: "AI_ERROR" }, { status: 502 });
  }
  return NextResponse.json({ message });
}
