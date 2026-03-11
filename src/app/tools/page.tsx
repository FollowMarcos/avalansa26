import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Scissors,
  ShieldCheck,
  Fingerprint,
  Search,
  Grid2x2,
  ArrowRight,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Tools | Avalansa',
  description:
    'Browse free creative tools — image splitting, safety analysis, provenance checking, shadowban detection, and more.',
  openGraph: {
    title: 'Tools | Avalansa',
    description:
      'Browse free creative tools — image splitting, safety analysis, provenance checking, shadowban detection, and more.',
  },
};

const TOOLS = [
  {
    name: 'X Multi-Image Laboratory',
    description:
      'Split images into custom grids for X multi-image posts. Live timeline preview, drag-to-pan, and bulk download.',
    href: '/tools/x-multi-image-preview-and-split',
    icon: Scissors,
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Image Safety Analyzer',
    description:
      'Classify images for NSFW content using AI. Runs entirely in your browser — no uploads, fully private.',
    href: '/tools/image-safety-analyzer',
    icon: ShieldCheck,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Content Provenance Checker',
    description:
      'Detect AI-generated content and verify image provenance using C2PA content credentials.',
    href: '/tools/content-provenance-checker',
    icon: Fingerprint,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    name: 'X Shadowban Checker',
    description:
      'Check if your X (Twitter) account has been shadowbanned. Tests search bans, ghost bans, and reply deboosting.',
    href: '/tools/shadowban-checker',
    icon: Search,
    gradient: 'from-orange-500 to-red-600',
  },
  {
    name: 'Quad Frame Stacker',
    description:
      'Split and stack images into quad-frame layouts with reference frames. Crop, zoom, and export individual strips.',
    href: '/tools/quad-frame-stacker',
    icon: Grid2x2,
    gradient: 'from-pink-500 to-rose-600',
  },
] as const;

export default function ToolsPage() {
  return (
    <PageShell contentClassName="bg-transparent">
      <main className="container max-w-5xl mx-auto px-6 pt-24 pb-20">
        <div className="space-y-2 mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Creative utilities for image processing, content analysis, and social media.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className={cn(
                  'group relative flex flex-col gap-4 p-6 rounded-xl border border-border bg-card',
                  'transition-all duration-200',
                  'hover:border-foreground/20 hover:shadow-lg hover:-translate-y-0.5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br text-white',
                    tool.gradient
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
                </div>

                <div className="space-y-1.5 flex-1">
                  <h2 className="font-semibold text-sm tracking-tight">
                    {tool.name}
                  </h2>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  <span>Open tool</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </PageShell>
  );
}
