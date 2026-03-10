'use client';

import { useState, useEffect } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { WallpaperCollection } from '@/types/wallpaper';
import { toast } from 'sonner';

interface CollectionManagerProps {
  selectedCollectionId?: string;
  onChange: (collectionId: string | undefined) => void;
}

export function CollectionManager({
  selectedCollectionId,
  onChange,
}: CollectionManagerProps) {
  const [collections, setCollections] = useState<WallpaperCollection[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    try {
      const res = await fetch('/api/wallpapers/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/wallpapers/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setCollections((prev) => [...prev, data.collection]);
        onChange(data.collection.id);
        setNewName('');
        setIsCreating(false);
        toast.success('Collection created!');
      } else {
        toast.error('Failed to create collection');
      }
    } catch {
      toast.error('Failed to create collection');
    }
  }

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground font-mono animate-pulse">
        Loading collections...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="font-vt323 text-sm uppercase tracking-wider">
        Collection (Optional)
      </Label>

      {/* Collection List */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-vt323 uppercase tracking-wider transition-all',
            !selectedCollectionId
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/5 text-muted-foreground hover:bg-primary/10'
          )}
        >
          None
        </button>
        {collections.map((col) => (
          <button
            type="button"
            key={col.id}
            onClick={() =>
              onChange(selectedCollectionId === col.id ? undefined : col.id)
            }
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-vt323 uppercase tracking-wider transition-all',
              selectedCollectionId === col.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/5 text-muted-foreground hover:bg-primary/10'
            )}
          >
            <FolderOpen className="w-3 h-3" />
            {col.name}
          </button>
        ))}
      </div>

      {/* Create New */}
      {isCreating ? (
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder="Collection name..."
            className="rounded-xl text-sm font-lato"
            autoFocus
          />
          <Button
            type="button"
            onClick={handleCreate}
            size="sm"
            className="rounded-xl font-vt323 uppercase"
            disabled={!newName.trim()}
          >
            Create
          </Button>
          <Button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setNewName('');
            }}
            size="sm"
            variant="ghost"
            className="rounded-xl font-vt323 uppercase"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 text-xs font-vt323 uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-3 h-3" />
          New Collection
        </button>
      )}
    </div>
  );
}
