import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, VT323, Lato } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

const lato = Lato({
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-lato",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Avalansa",
    template: "%s | Avalansa",
  },
  description: "A secure, AI-curated operation system for your content.",
  metadataBase: new URL("https://avalansa.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Avalansa",
    description: "A secure, AI-curated operation system for your content. Save, share, and remix prompts.",
    url: "https://avalansa.com",
    siteName: "Avalansa",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png", // Verify this exists or is generated
        width: 1200,
        height: 630,
        alt: "Avalansa - AI Operation System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Avalansa",
    description: "A secure, AI-curated operation system for your content. Save, share, and remix prompts.",
    images: ["/og-image.png"], // Verify this exists or is generated
    creator: "@avalansa", // Update if known
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/ab.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${vt323.variable} ${lato.variable} antialiased`}>
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
