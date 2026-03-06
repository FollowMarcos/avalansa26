import { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { CreateV2Layout } from "@/components/createv2/createv2-layout";

export const metadata: Metadata = {
  title: "Create V2",
  description:
    "AI-powered image generation with conversational chat interface.",
  alternates: {
    canonical: "/createv2",
  },
  openGraph: {
    title: "Create V2 | Avalansa",
    description:
      "AI-powered image generation with conversational chat interface.",
    url: "/createv2",
    type: "website",
  },
};

export default function CreateV2Page() {
  return (
    <PageShell showDock={true} dockPosition="left" className="p-0" noDockPadding>
      <CreateV2Layout />
    </PageShell>
  );
}
