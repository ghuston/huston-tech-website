import type { Metadata, Viewport } from "next";
import { homeMeta } from "@/content/home";
import { siteConfig } from "@/content/site";
import { inter, newsreader, outfit } from "@/lib/fonts";
import { OG_IMAGE_ALT, OG_IMAGE_PATH } from "@/lib/metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: homeMeta.title,
    template: `%s | ${siteConfig.name}`,
  },
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.founder }],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_US",
    images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE_PATH] },
};

export const viewport: Viewport = {
  themeColor: "#F3F5F4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${inter.variable} ${newsreader.variable}`}>
      <head>
        <script>{"document.documentElement.classList.add('js')"}</script>
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-ink px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        {/* The header, main and footer come from app/(site)/layout.tsx (SiteChrome); /card renders its own main. */}
        {children}
      </body>
    </html>
  );
}
