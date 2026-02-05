import { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { CharacterLibraryPage } from "./character-library-page";

export const metadata: Metadata = {
  title: "Characters",
  description:
    "Manage your AI image generation characters. Organize reference images, prompt templates, and track generated content for each character.",
  alternates: {
    canonical: "/characters",
  },
  openGraph: {
    title: "Characters | Avalansa",
    description:
      "Manage your AI image generation characters. Organize reference images, prompt templates, and track generated content for each character.",
    url: "/characters",
    type: "website",
    locale: "en_US",
  },
};

export default function CharactersPage() {
  return (
    <PageShell showDock={true} dockPosition="bottom">
      <CharacterLibraryPage />
    </PageShell>
  );
}
