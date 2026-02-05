import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { CharacterDetailPage } from "./character-detail-page";
import { getCharacterWithAllImages } from "@/utils/supabase/characters.server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const character = await getCharacterWithAllImages(id);

  if (!character) {
    return {
      title: "Character Not Found",
    };
  }

  return {
    title: `${character.name} | Characters`,
    description:
      character.description || `View and manage ${character.name} character`,
    openGraph: {
      title: `${character.name} | Avalansa Characters`,
      description:
        character.description || `View and manage ${character.name} character`,
      type: "article",
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const character = await getCharacterWithAllImages(id);

  if (!character) {
    notFound();
  }

  return (
    <PageShell showDock={true} dockPosition="bottom">
      <CharacterDetailPage characterId={id} initialCharacter={character} />
    </PageShell>
  );
}
