import { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { EditorLayout } from "@/components/editor/editor-layout";

export const metadata: Metadata = {
  title: "Editor",
  description: "Advanced image generation editor with reference controls and inpainting.",
  alternates: { canonical: "/editor" },
  openGraph: {
    title: "Editor",
    description: "Advanced image generation editor with reference controls and inpainting.",
    type: "website",
  },
};

export default function EditorPage() {
  return (
    <PageShell showDock={true} dockPosition="right" className="p-0" noDockPadding>
      <EditorLayout />
    </PageShell>
  );
}
