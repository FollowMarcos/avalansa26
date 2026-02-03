import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSharedCanvas } from '@/utils/supabase/shares.server';
import { SharedCanvasViewer } from '@/components/share/shared-canvas-viewer';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const sharedData = await getSharedCanvas(token);

  if (!sharedData) {
    return {
      title: 'Canvas Not Found',
    };
  }

  const { share, owner } = sharedData;

  return {
    title: share.title,
    description: share.description || `Canvas shared by @${owner.username || 'unknown'}`,
    openGraph: {
      title: share.title,
      description: share.description || `Canvas shared by @${owner.username || 'unknown'}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: share.title,
      description: share.description || `Canvas shared by @${owner.username || 'unknown'}`,
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const sharedData = await getSharedCanvas(token);

  if (!sharedData) {
    notFound();
  }

  return <SharedCanvasViewer data={sharedData} />;
}
