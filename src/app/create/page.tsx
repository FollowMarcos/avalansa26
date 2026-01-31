import { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { StudioLayout } from "@/components/create/studio-layout";

export const metadata: Metadata = {
  title: "Create // AI Studio",
  description:
    "Create stunning images with Gemini 3 Pro AI. Studio-quality generation with 4K resolution, text rendering, style transfer, and more.",
  openGraph: {
    title: "Create // AI Studio",
    description:
      "Create stunning images with Gemini 3 Pro AI. Studio-quality generation with 4K resolution, text rendering, style transfer, and more.",
  },
};

export default function CreatePage() {
  return (
    <PageShell showDock={true} dockPosition="left" className="p-0" contentClassName="pl-0">
      <StudioLayout />
    </PageShell>
  );
}
