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

import { Newsreader } from "next/font/google";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["italic", "normal"],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} antialiased`}>
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
