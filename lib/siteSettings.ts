import { prisma } from "@/lib/prisma";

export const DEFAULT_THEME_COLOR = "#7a51c9";
export const DEFAULT_BACKGROUND_COLOR = "#faf9fc";

export async function getSiteSettings() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  return {
    themeColor: settings?.themeColor ?? DEFAULT_THEME_COLOR,
    backgroundColor: settings?.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
  };
}
