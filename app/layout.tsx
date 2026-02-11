import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Inter, Libre_Baskerville } from 'next/font/google';
import "@/app/globals.css";

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-libre',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Regulatory Newsletter for Latvian laws",
  description:
    "AI-powered regulatory updates for Latvian legal teams — short, plain-language summaries with direct links to official sources.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${libreBaskerville.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.css"
        />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
        <script
          async
          src="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.js"
        ></script>
      </body>
    </html>
  );
}
