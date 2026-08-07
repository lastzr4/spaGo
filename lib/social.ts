export type SocialPlatform = "instagram" | "tiktok" | "threads" | "x";

const BASE_URL: Record<SocialPlatform, string> = {
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/@",
  threads: "https://threads.net/@",
  x: "https://x.com/",
};

export function buildSocialLink(platform: SocialPlatform, value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  return `${BASE_URL[platform]}${handle}`;
}
