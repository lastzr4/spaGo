import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms" className={jakarta.variable}>
      <body className="min-h-screen bg-brand-950/5 font-sans">
        <ServiceWorkerRegister />
        <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-app-bg shadow-2xl sm:max-w-lg">
          {children}
        </div>
      </body>
    </html>
  );
}
