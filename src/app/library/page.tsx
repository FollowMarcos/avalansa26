import { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { PromptLibraryPage } from "./prompt-library-page";

export const metadata: Metadata = {
  title: "Prompt Library",
  description:
    "Browse and manage your saved AI image generation prompts. Organize with folders and tags, share with others.",
  alternates: {
    canonical: "/library",
  },
  openGraph: {
    title: "Prompt Library | Avalansa",
    description:
      "Browse and manage your saved AI image generation prompts. Organize with folders and tags, share with others.",
    url: "/library",
    type: "website",
    locale: "en_US",
  },
};

export default function LibraryPage() {
  return (
    <PageShell showDock={true} dockPosition="bottom">
      <PromptLibraryPage />
    </PageShell>
  );
}
