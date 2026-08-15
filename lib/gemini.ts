// AI service-photo generation via Google's Gemini API (image-capable
// model). Same fail-open contract as the Anthropic helpers in
// lib/anthropic.ts: returns null on a missing key or any failure, never
// throws — a therapist adding a service without a photo should never be
// blocked just because image generation hiccupped. The therapist can always
// upload their own photo instead, or retry generation later.
//
// Uses the plain Gemini API (generativelanguage.googleapis.com) with an API
// key — no Vertex AI / service account setup needed. Set GEMINI_API_KEY in
// the environment (Railway → Variables) to enable this feature.
const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-lite-image"; // cheapest/fastest image model — plenty for simple service-card photos

export async function generateServiceImage(params: {
  serviceName: string;
  description?: string | null;
  isPackage?: boolean;
}): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const subject = params.isPackage
    ? `a spa package called "${params.serviceName}"`
    : `a spa/massage service called "${params.serviceName}"`;

  // Explicitly steer away from anything intimate/ambiguous — this generates
  // real customer-facing marketing photos, so the framing must read as a
  // clean, professional wellness photo every time, not something that
  // could get flagged or look inappropriate.
  const prompt = [
    `A professional, warm, appetizing marketing photo representing ${subject} at a home-visit mobile massage/spa business in Malaysia.`,
    params.description ? `Context: ${params.description}.` : "",
    "Realistic photo style, soft natural lighting, clean and tidy spa/wellness setting, fully clothed therapist and client at all times, entirely non-sexual and professional in tone, similar to a spa website hero photo.",
    "Square 1:1 composition, no text or watermarks in the image.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });

    if (!res.ok) {
      console.error("[generateServiceImage] Gemini request failed:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const parts: any[] = data?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      // REST JSON from Google APIs is camelCase, but check the snake_case
      // variant too — cheap defensive coding against any API-version drift.
      const inline = part?.inlineData ?? part?.inline_data;
      if (inline?.data) {
        const mimeType = inline.mimeType ?? inline.mime_type ?? "image/png";
        return `data:${mimeType};base64,${inline.data}`;
      }
    }

    console.error("[generateServiceImage] no image data in Gemini response:", JSON.stringify(data).slice(0, 500));
    return null;
  } catch (err) {
    console.error("[generateServiceImage] request failed:", err);
    return null;
  }
}
