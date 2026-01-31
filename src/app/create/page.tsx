import { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { StudioLayout } from "@/components/create/studio-layout";

export const metadata: Metadata = {
  title: "Create",
  description:
    "Create stunning images with AI. Studio-quality generation with 4K resolution, text rendering, style transfer, and more.",
  alternates: {
    canonical: "/create",
  },
  openGraph: {
    title: "Create | Avalansa",
    description:
      "Create stunning images with AI. Studio-quality generation with 4K resolution, text rendering, style transfer, and more.",
    url: "/create",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Avalansa AI Studio - Create stunning images",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create | Avalansa",
    description:
      "Create stunning images with AI. Studio-quality generation with 4K resolution, text rendering, style transfer, and more.",
    images: ["/og-image.png"],
  },
};

export default function CreatePage() {
  return (
    <PageShell showDock={true} dockPosition="left" className="p-0" noDockPadding>
      <StudioLayout />
    </PageShell>
  );
}
