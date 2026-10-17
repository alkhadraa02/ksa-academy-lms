import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "./globals.css";
import { BRAND, SiteHeader } from "@/components/SiteHeader";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3105";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} | دورات تدريبية احترافية بالعربية`, template: `%s | ${BRAND}` },
  description:
    "منصة تعلّم إلكتروني عربية: دورات تدريبية بمحتوى فيديو ونصوص، اختبارات تصحيح تلقائي، وشهادات إتمام قابلة للطباعة.",
  openGraph: { type: "website", locale: "ar_SA", siteName: BRAND },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f6b5c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-ink"
        >
          تخطَّ إلى المحتوى
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <footer className="no-print border-t border-line bg-surface py-6 text-center text-sm text-muted">
          <div className="container-page">© 2026 {BRAND}. جميع الحقوق محفوظة.</div>
        </footer>
      </body>
    </html>
  );
}
