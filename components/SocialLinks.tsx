import { InstagramIcon, TiktokIcon, ThreadsIcon, SocialXIcon } from "@/components/icons";
import { buildSocialLink } from "@/lib/social";

export default function SocialLinks({
  instagram,
  tiktok,
  threads,
  x,
}: {
  instagram?: string | null;
  tiktok?: string | null;
  threads?: string | null;
  x?: string | null;
}) {
  const links = [
    instagram ? { key: "ig", href: buildSocialLink("instagram", instagram), Icon: InstagramIcon } : null,
    tiktok ? { key: "tt", href: buildSocialLink("tiktok", tiktok), Icon: TiktokIcon } : null,
    threads ? { key: "th", href: buildSocialLink("threads", threads), Icon: ThreadsIcon } : null,
    x ? { key: "x", href: buildSocialLink("x", x), Icon: SocialXIcon } : null,
  ].filter((l): l is { key: string; href: string; Icon: typeof InstagramIcon } => l !== null);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {links.map(({ key, href, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-transform active:scale-90"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
