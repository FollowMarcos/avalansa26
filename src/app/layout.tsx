import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import {
  Newsreader, Inter, Playfair_Display, Cormorant_Garamond, Space_Grotesk, Syne, JetBrains_Mono, Lora,
  Bricolage_Grotesque, Fraunces, Work_Sans, DM_Serif_Display, Outfit, Archivo_Black
} from "next/font/google";

const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["italic", "normal"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["italic", "normal"] });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], style: ["italic", "normal"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], style: ["italic", "normal"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], style: ["italic", "normal"] });
const workSans = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"] });
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", weight: "400", subsets: ["latin"], style: ["italic", "normal"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const archivoBlack = Archivo_Black({ variable: "--font-archivo", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Avalansa",
    template: "%s | Avalansa",
  },
  description: "A secure, AI-curated operation system for your content.",
  metadataBase: new URL("https://avalansa.com"), // Placeholder, update to actual domain
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://avalansa.com",
    title: "Avalansa",
    description: "A secure, AI-curated operation system for your content.",
    siteName: "Avalansa",
  },
  twitter: {
    card: "summary_large_image",
    title: "Avalansa",
    description: "A secure, AI-curated operation system for your content.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/ab.svg",
  },
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} ${inter.variable} ${playfair.variable} ${cormorant.variable} ${spaceGrotesk.variable} ${syne.variable} ${lora.variable} ${jetbrainsMono.variable} ${bricolage.variable} ${fraunces.variable} ${workSans.variable} ${dmSerif.variable} ${outfit.variable} ${archivoBlack.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
