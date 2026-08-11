import Anthropic from "@anthropic-ai/sdk";
import { RECEIPT_FORMAT_REFERENCE } from "@/lib/receiptFormats";

// Shared client + helper for every AI-assisted feature in the dashboard
// (bio polish, review summary, follow-up drafting, pricing guidance,
// content moderation) plus the public chat widget. One place to swap
// models or add retry/logging later instead of duplicating boilerplate
// across every route.
export const AI_MODEL = "claude-haiku-4-5-20251001";

let cachedClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

// Single-turn helper: system prompt + one user message in, plain text out.
// Returns null (never throws) if the key is missing or the call fails, so
// every caller can treat "no AI result" as a normal, expected outcome
// (fail-open) rather than a crash.
export async function askClaude(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: params.maxTokens ?? 300,
      system: params.system,
      messages: [{ role: "user", content: params.prompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return text || null;
  } catch (err) {
    console.error("[askClaude] request failed:", err);
    return null;
  }
}

export type ExtractedService = { name: string; durationMinutes: number; price: number; description: string | null };

// Vision/document extraction: reads a price-list image or PDF and returns a
// structured list of services (name/duration/price/description). Used by
// the "Upload Senarai Harga (AI)" feature on the Urus Servis page so a
// therapist can skip manually retyping every service. Same fail-open
// contract as askClaude — returns null on any failure, never throws.
export async function extractServicesFromDocument(params: {
  base64Data: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf";
}): Promise<ExtractedService[] | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  const isPdf = params.mediaType === "application/pdf";

  try {
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 2000,
      system:
        "Anda pembantu yang membaca senarai harga servis spa/urut daripada gambar atau dokumen, dan mengeluarkan SEMATA-MATA JSON array yang sah — tiada teks lain, tiada penjelasan, tiada markdown code fence. Setiap item mesti ada field: name (string, nama servis, kekalkan bahasa asal), durationMinutes (integer minit, anggarkan 60 jika tiada dinyatakan), price (nombor dalam Ringgit Malaysia sahaja, tanpa simbol RM atau koma), description (string ringkas jika ada penerangan berkaitan, jika tiada guna null). Jika tiada servis dapat dikenal pasti dalam dokumen, pulangkan array kosong [].",
      messages: [
        {
          role: "user",
          content: [
            isPdf
              ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: params.base64Data } }
              : {
                  type: "image" as const,
                  source: {
                    type: "base64" as const,
                    media_type: params.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                    data: params.base64Data,
                  },
                },
            { type: "text" as const, text: "Ekstrak semua servis, tempoh, dan harga daripada dokumen/gambar ini sebagai JSON array sahaja." },
          ],
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!text) return null;

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed: unknown = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return null;

    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof (item as { name?: unknown }).name === "string")
      .map((item) => {
        const durationRaw = Number(item.durationMinutes);
        const priceRaw = Number(item.price);
        return {
          name: String(item.name).trim().slice(0, 200),
          durationMinutes: Number.isFinite(durationRaw) && durationRaw > 0 ? Math.round(durationRaw) : 60,
          price: Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : 0,
          description: typeof item.description === "string" && item.description.trim() ? item.description.trim().slice(0, 500) : null,
        };
      })
      .filter((item) => item.name && item.price > 0);
  } catch (err) {
    console.error("[extractServicesFromDocument] request failed:", err);
    return null;
  }
}

export type ReceiptVerdict = "LIKELY_VALID" | "NEEDS_MANUAL_CHECK" | "SUSPICIOUS";
export type ReceiptVerification = { verdict: ReceiptVerdict; amountDetected: number | null; detectedProvider: string | null; notes: string };

// Heuristic red-flag check on a payment receipt screenshot — this can NEVER
// confirm money actually moved (no bank/payment-gateway access), only spot
// visual inconsistencies a casual fake tends to have: editing artifacts,
// mismatched fonts/logos, amount that doesn't match the expected deposit,
// a timestamp that doesn't make sense (too old, future-dated), or a
// "pending"/"failed" status being passed off as success. The therapist must
// still check their own bank/e-wallet before confirming — the AI notes
// always say so explicitly, and the UI must never claim this "verifies" the
// payment. Same fail-open contract as the other AI helpers.
export async function verifyPaymentReceipt(params: {
  base64Data: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  expectedAmount: number;
}): Promise<ReceiptVerification | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 400,
      system:
        "Anda pembantu yang memeriksa gambar resit/bukti pemindahan bank atau e-wallet (DuitNow, QR, dll) untuk terapis urut mobile di Malaysia, bagi mengesan tanda-tanda resit palsu atau diedit. PENTING: anda TIDAK boleh mengesahkan wang sebenarnya telah masuk — anda hanya boleh kesan tanda visual yang mencurigakan. Guna panduan format resit bank/e-wallet Malaysia di bawah untuk kenal pasti platform yang didakwa dan bandingkan dengan corak sebenar (warna tema, logo, terminologi, susunan medan) — kalau resit didakwa dari satu bank tapi tak sepadan dengan corak biasa bank tersebut, ini tanda kuat ia palsu/diedit.\n\n" +
        RECEIPT_FORMAT_REFERENCE +
        "\n\nBalas SEMATA-MATA dengan JSON (tiada teks lain, tiada markdown): { \"verdict\": \"LIKELY_VALID\" | \"NEEDS_MANUAL_CHECK\" | \"SUSPICIOUS\", \"amountDetected\": nombor atau null jika tidak jelas, \"detectedProvider\": nama bank/e-wallet yang dikesan (cth \"Maybank2u\", \"Touch 'n Go eWallet\") atau null jika tidak dapat dikenal pasti, \"notes\": ayat pendek dalam Bahasa Malaysia (1-2 ayat) menerangkan sebab verdict — sebut platform yang dikesan dan sama ada ia sepadan dengan corak biasa, DAN sentiasa ingatkan terapis untuk sahkan sendiri di aplikasi bank/e-wallet mereka sebelum mengesahkan tempahan }.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image" as const,
              source: { type: "base64" as const, media_type: params.mediaType, data: params.base64Data },
            },
            {
              type: "text" as const,
              text: `Jumlah deposit yang dijangka: RM${params.expectedAmount.toFixed(2)}. Semak gambar resit ini dan berikan verdict.`,
            },
          ],
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (!text) return null;

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as { verdict?: unknown; amountDetected?: unknown; detectedProvider?: unknown; notes?: unknown };
    const verdict = parsed.verdict === "LIKELY_VALID" || parsed.verdict === "SUSPICIOUS" ? parsed.verdict : "NEEDS_MANUAL_CHECK";
    const amountDetected = typeof parsed.amountDetected === "number" && Number.isFinite(parsed.amountDetected) ? parsed.amountDetected : null;
    const detectedProvider = typeof parsed.detectedProvider === "string" && parsed.detectedProvider.trim() ? parsed.detectedProvider.trim().slice(0, 60) : null;
    const notes =
      typeof parsed.notes === "string" && parsed.notes.trim()
        ? parsed.notes.trim().slice(0, 500)
        : "Sila sahkan sendiri di aplikasi bank/e-wallet anda sebelum mengesahkan tempahan.";

    return { verdict, amountDetected, detectedProvider, notes };
  } catch (err) {
    console.error("[verifyPaymentReceipt] request failed:", err);
    return null;
  }
}
