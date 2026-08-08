import Anthropic from "@anthropic-ai/sdk";

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
