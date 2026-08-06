import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { getSiteSettings } from "@/lib/siteSettings";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SpaGo | Urut Rumah, Ditempah Terus",
  description: "Tempah terapis urut mobile berhampiran anda — carian ikut kawasan, gender-matched, terus ke WhatsApp.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SpaGo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#7a51c9",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings().catch(() => ({ themeColor: "#7a51c9", backgroundColor: "#faf9fc" }));

  return (
    <html lang="ms" className={jakarta.variable}>
      <body
        className="min-h-screen font-sans"
        style={{
          background: settings.backgroundColor,
          ["--brand" as string]: settings.themeColor,
          ["--app-bg" as string]: settings.backgroundColor,
        }}
      >
        <ServiceWorkerRegister />
        <div className="relative mx-auto flex min-h-screen max-w-md flex-col shadow-2xl sm:max-w-lg" style={{ background: "var(--app-bg)" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
