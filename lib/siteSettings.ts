import { prisma } from "@/lib/prisma";

export const DEFAULT_THEME_COLOR = "#7a51c9";
export const DEFAULT_BACKGROUND_COLOR = "#120a1e";
export const DEFAULT_HERO_TITLE = "Urut rumah, ditempah terus.";
export const DEFAULT_HERO_SUBTITLE =
  "Cari terapis mobile berhampiran anda dan tempah terus ke WhatsApp — tanpa PM, tanpa tunggu.";

export async function getSiteSettings() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  return {
    themeColor: settings?.themeColor ?? DEFAULT_THEME_COLOR,
    backgroundColor: settings?.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
    heroTitle: settings?.heroTitle ?? DEFAULT_HERO_TITLE,
    heroSubtitle: settings?.heroSubtitle ?? DEFAULT_HERO_SUBTITLE,
    heroBackgroundImage: settings?.heroBackgroundImage ?? null,
    adminEmail: settings?.adminEmail ?? null,
  };
}
