'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Search, X, Sparkles, Heart, Clock, Bot, Plus, type LucideIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { PromptCard } from '../prompt-card';
import { AvaCard } from '../ava-card';
import type { Prompt } from '@/types/prompt';
import type { Ava } from '@/types/ava';

type VaultFilter = 'all' | 'favorites' | 'recent' | 'avas';

export interface VaultTabProps {
  prompts: Prompt[];
  onSelectPrompt: (prompt: Prompt) => void;
  onToggleFavorite: (promptId: string, isFavorite: boolean) => void;
  onSharePrompt: (prompt: Prompt) => void;
  onDeletePrompt: (promptId: string) => void;
  avas: Ava[];
  onRunAva?: (ava: Ava) => void;
  onEditAva?: (ava: Ava) => void;
  onCreateAva?: () => void;
  onToggleAvaFavorite?: (avaId: string, isFavorite: boolean) => void;
  onShareAva?: (ava: Ava) => void;
  onDeleteAva?: (avaId: string) => void;
}

const FILTERS: { id: VaultFilter; icon: LucideIcon; label: string }[] = [
  { id: 'all', icon: Sparkles, label: 'All' },
  { id: 'favorites', icon: Heart, label: 'Favs' },
  { id: 'recent', icon: Clock, label: 'Recent' },
  { id: 'avas', icon: Bot, label: 'Avas' },
];

export function VaultTab({
  prompts,
  onSelectPrompt,
  onToggleFavorite,
  onSharePrompt,
  onDeletePrompt,
  avas,
  onRunAva,
  onEditAva,
  onCreateAva,
  onToggleAvaFavorite,
  onShareAva,
  onDeleteAva,
}: VaultTabProps) {
  const [filter, setFilter] = React.useState<VaultFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredPrompts = React.useMemo(() => {
    let filtered = prompts;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.prompt_text.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query),
      );
    }
    if (filter === 'favorites') {
      filtered = filtered.filter((p) => p.is_favorite);
    } else if (filter === 'recent') {
      filtered = [...filtered]
        .filter((p) => p.use_count > 0)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )
        .slice(0, 10);
    }
    return filtered;
  }, [prompts, searchQuery, filter]);

  const filteredAvas = React.useMemo(() => {
    if (!searchQuery) return avas;
    const query = searchQuery.toLowerCase();
    return avas.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.instructions.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query),
    );
  }, [avas, searchQuery]);

  const isAvasView = filter === 'avas';

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search */}
      <div className="px-3 py-1.5 border-b border-border/50">
        <div className="relative">
          <Search
            className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAvasView ? 'Search Avas\u2026' : 'Search prompts\u2026'}
            aria-label={isAvasView ? 'Search Avas' : 'Search prompts'}
            className="w-full pl-7 pr-7 py-1.5 rounded-md border border-border bg-muted/30 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1 px-3 py-1.5 border-b border-border/50">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              filter === f.id
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <f.icon className="size-3" aria-hidden="true" />
            {f.label}
          </button>
        ))}
      </div>

      {/* Content list */}
      <ScrollArea className="flex-1">
        {isAvasView ? (
          <>
            {onCreateAva && (
              <div className="p-2 pb-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateAva}
                  className="w-full h-7 text-xs"
                >
                  <Plus className="size-3 mr-1" aria-hidden="true" />
                  Create Ava
                </Button>
              </div>
            )}
            {filteredAvas.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6">
                <Bot
                  className="size-6 text-muted-foreground/30 mb-2"
                  aria-hidden="true"
                />
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? 'No matching Avas' : 'No Avas yet'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {filteredAvas.map((ava) => (
                  <AvaCard
                    key={ava.id}
                    ava={ava}
                    onSelect={onRunAva}
                    onEdit={onEditAva}
                    onToggleFavorite={onToggleAvaFavorite}
                    onShare={onShareAva}
                    onDelete={onDeleteAva}
                  />
                ))}
              </div>
            )}
          </>
        ) : filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6">
            <Sparkles
              className="size-6 text-muted-foreground/30 mb-2"
              aria-hidden="true"
            />
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? 'No matching prompts'
                : filter === 'favorites'
                  ? 'No favorites yet'
                  : filter === 'recent'
                    ? 'No recently used'
                    : 'No saved prompts'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onSelect={onSelectPrompt}
                onToggleFavorite={onToggleFavorite}
                onShare={onSharePrompt}
                onDelete={onDeletePrompt}
                showActions
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
