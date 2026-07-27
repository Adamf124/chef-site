import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { site } from "@/site.config";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  // Without metadataBase, relative image URLs in the card resolve against
  // localhost and the preview silently breaks once shared.
  metadataBase: new URL(site.url),
  title: `${site.chefName} — Chef`,
  description: site.tagline,
  openGraph: {
    type: "website",
    siteName: site.chefName,
    title: `${site.chefName} — Chef`,
    description: site.tagline,
    url: site.url,
  },
  twitter: {
    // The whole point of the site is the photographs, so the card shows one
    // large rather than a thumbnail. app/page.tsx supplies the image.
    card: "summary_large_image",
    title: `${site.chefName} — Chef`,
    description: site.tagline,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  );
}
