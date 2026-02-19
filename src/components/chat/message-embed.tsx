'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, GitBranch, ExternalLink } from 'lucide-react';
import type {
  EmbedType,
  EmbedData,
  GenerationEmbed,
  PromptEmbed,
  WorkflowEmbed,
  LinkEmbed,
} from '@/types/chat';

/** Only allow safe URL protocols to prevent javascript: XSS. */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

interface MessageEmbedProps {
  type: EmbedType;
  data: EmbedData;
}

export function MessageEmbed({ type, data }: MessageEmbedProps) {
  switch (type) {
    case 'generation':
      return <GenerationEmbedCard data={data as GenerationEmbed} />;
    case 'prompt':
      return <PromptEmbedCard data={data as PromptEmbed} />;
    case 'workflow':
      return <WorkflowEmbedCard data={data as WorkflowEmbed} />;
    case 'link':
      return <LinkEmbedCard data={data as LinkEmbed} />;
    default:
      return null;
  }
}

// ============================================
// Generation Embed
// ============================================

function GenerationEmbedCard({ data }: { data: GenerationEmbed }) {
  const handleGenerate = () => {
    // Use the existing sessionStorage bridge
    sessionStorage.setItem('loadPrompt', data.prompt);
    window.open('/create', '_blank');
  };

  return (
    <div className="mt-2 rounded-lg border border-border overflow-hidden max-w-sm bg-card">
      {/* Image */}
      {data.image_url && (
        <div className="relative aspect-square max-h-[300px] bg-muted">
          <Image
            src={data.image_url}
            alt={data.prompt || 'Generated image'}
            fill
            className="object-contain"
            sizes="(max-width: 384px) 100vw, 384px"
          />
        </div>
      )}

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-medium text-primary">
            AI Generation
          </span>
          {data.model && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {data.model}
            </span>
          )}
          {data.aspect_ratio && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {data.aspect_ratio}
            </span>
          )}
        </div>

        {data.prompt && (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {data.prompt}
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-7"
          onClick={handleGenerate}
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Generate from this
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Prompt Embed
// ============================================

function PromptEmbedCard({ data }: { data: PromptEmbed }) {
  const handleUse = () => {
    sessionStorage.setItem('loadPrompt', data.text);
    window.open('/create', '_blank');
  };

  return (
    <div className="mt-2 rounded-lg border border-border p-3 max-w-sm bg-card space-y-2">
      <div className="flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
        <span className="text-xs font-medium text-blue-500">
          Shared Prompt
        </span>
      </div>

      <p className="text-sm bg-muted/50 rounded-md p-2 font-mono text-xs leading-relaxed">
        {data.text}
      </p>

      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs h-7"
        onClick={handleUse}
      >
        <Sparkles className="h-3 w-3 mr-1" />
        Use this prompt
      </Button>
    </div>
  );
}

// ============================================
// Workflow Embed
// ============================================

function WorkflowEmbedCard({ data }: { data: WorkflowEmbed }) {
  return (
    <div className="mt-2 rounded-lg border border-border p-3 max-w-sm bg-card space-y-2">
      <div className="flex items-center gap-2">
        <GitBranch className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
        <span className="text-xs font-medium text-purple-500">
          Shared Workflow
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{data.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
          {data.node_count} nodes
        </span>
      </div>

      {data.thumbnail_url && (
        <div className="relative h-32 bg-muted rounded-md overflow-hidden">
          <Image
            src={data.thumbnail_url}
            alt={data.name}
            fill
            className="object-cover"
            sizes="384px"
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// Link Embed
// ============================================

function LinkEmbedCard({ data }: { data: LinkEmbed }) {
  const safeUrl = isSafeUrl(data.url) ? data.url : undefined;

  if (!safeUrl) {
    return (
      <div className="mt-2 rounded-lg border border-destructive/30 p-3 max-w-sm bg-card">
        <p className="text-xs text-destructive">Blocked: unsafe link</p>
      </div>
    );
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block rounded-lg border border-border p-3 max-w-sm bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-xs text-muted-foreground truncate">
          {data.url}
        </span>
      </div>

      {data.title && (
        <p className="text-sm font-medium mt-1">{data.title}</p>
      )}

      {data.description && (
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {data.description}
        </p>
      )}

      {data.image_url && isSafeUrl(data.image_url) && (
        <div className="relative h-32 bg-muted rounded-md overflow-hidden mt-2">
          <Image
            src={data.image_url}
            alt={data.title ?? 'Link preview'}
            fill
            className="object-cover"
            sizes="384px"
          />
        </div>
      )}
    </a>
  );
}
