import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { PromptDetailPage } from "./prompt-detail-page";
import { getPromptWithImages } from "@/utils/supabase/prompts.server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const prompt = await getPromptWithImages(id);

  if (!prompt) {
    return {
      title: "Prompt Not Found",
    };
  }

  return {
    title: `${prompt.name} | Prompt Library`,
    description: prompt.description || prompt.prompt_text.slice(0, 160),
    openGraph: {
      title: `${prompt.name} | Avalansa Prompt Library`,
      description: prompt.description || prompt.prompt_text.slice(0, 160),
      type: "article",
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const prompt = await getPromptWithImages(id);

  if (!prompt) {
    notFound();
  }

  return (
    <PageShell showDock={true} dockPosition="bottom">
      <PromptDetailPage promptId={id} initialPrompt={prompt} />
    </PageShell>
  );
}
