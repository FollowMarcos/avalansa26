import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { WallpaperUploadForm } from '@/components/wallpapers/wallpaper-upload-form';

export const metadata: Metadata = {
  title: 'Upload Wallpaper | Avalansa',
  description: 'Upload and share your wallpapers with the Avalansa community.',
};

export default function UploadWallpaperPage() {
  return (
    <PageShell contentClassName="bg-transparent">
      <main className="container max-w-3xl mx-auto px-6 pt-24 pb-20">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-vt323 text-4xl text-foreground uppercase tracking-tight">
              Upload Wallpaper
            </h1>
            <p className="font-lato text-muted-foreground">
              Share your wallpapers with the community.
            </p>
          </div>

          <WallpaperUploadForm />
        </div>
      </main>
    </PageShell>
  );
}
