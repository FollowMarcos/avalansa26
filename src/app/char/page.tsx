import { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { CharStudioLayout } from "@/components/char/char-studio-layout";

export const metadata: Metadata = {
  title: "Character Studio",
  description:
    "Design character concept art with AI. Multi-view sheets, outfit variations, expression sheets, and color palette management.",
  alternates: {
    canonical: "/char",
  },
  openGraph: {
    title: "Character Studio | Avalansa",
    description:
      "Design character concept art with AI. Multi-view sheets, outfit variations, expression sheets, and color palette management.",
    url: "/char",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Avalansa Character Studio - Design concept art with AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Character Studio | Avalansa",
    description:
      "Design character concept art with AI. Multi-view sheets, outfit variations, expression sheets, and color palette management.",
    images: ["/og-image.png"],
  },
};

export default function CharPage() {
  return (
    <PageShell showDock={true} dockPosition="left" className="p-0" noDockPadding>
      <CharStudioLayout />
    </PageShell>
  );
}
