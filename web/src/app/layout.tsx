import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans, Montserrat, Open_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { DemoPath } from "@/components/DemoPath";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

// Self-hosted at build time by next/font (CSP: font-src 'self').
const montserrat = Montserrat({ subsets: ["latin", "cyrillic"], weight: ["600", "700", "800"], variable: "--font-montserrat", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin", "cyrillic"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--font-open-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin", "cyrillic"], weight: ["500"], variable: "--font-plex-mono", display: "swap" });

const plexSans = IBM_Plex_Sans({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-plex-sans", display: "swap" });
const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-barlow", display: "swap" });

export const metadata: Metadata = {
  title: { default: "AIGO Collection", template: "%s · AIGO Collection" },
  description: "AIGO Collection: cards that build AI skills.",
  applicationName: "AIGO Collection",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${openSans.variable} ${plexMono.variable} ${barlow.variable} ${plexSans.variable}`}>
      <body>
        <a href="#main" className="skipLink">Skip to content</a>
        <SiteHeader />
        <main id="main" className="siteMain">{children}</main>
        <DemoPath />
      </body>
    </html>
  );
}
