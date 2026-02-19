'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { getAccessibleChannels } from '@/utils/supabase/chat-channels.server';
import { sendMessage } from '@/utils/supabase/chat-messages.server';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hash, Lock, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ChatChannel, GenerationEmbed, PromptEmbed } from '@/types/chat';

interface ShareToChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** For sharing a generation */
  generation?: {
    id: string;
    image_url: string;
    prompt: string;
    model?: string;
    aspect_ratio?: string;
  };
  /** For sharing a prompt */
  prompt?: {
    id: string;
    text: string;
    tags?: string[];
  };
}

export function ShareToChannelDialog({
  open,
  onOpenChange,
  generation,
  prompt,
}: ShareToChannelDialogProps) {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load channels on open
  useEffect(() => {
    if (!open) return;

    async function load() {
      setIsLoading(true);
      const data = await getAccessibleChannels();
      setChannels(data);
      setIsLoading(false);
    }

    load();
  }, [open]);

  const handleShare = async () => {
    if (!selectedChannelId) return;

    setIsSending(true);

    const messageContent = comment.trim() || (generation ? 'Shared a generation' : 'Shared a prompt');

    if (generation) {
      const embedData: GenerationEmbed = {
        generation_id: generation.id,
        image_url: generation.image_url,
        prompt: generation.prompt,
        model: generation.model ?? '',
        aspect_ratio: generation.aspect_ratio,
      };

      const result = await sendMessage(selectedChannelId, {
        content: messageContent,
        embed_type: 'generation',
        embed_data: embedData,
      });

      if (result) {
        toast.success('Shared to channel');
        onOpenChange(false);
        setComment('');
        setSelectedChannelId(null);
      } else {
        toast.error('Failed to share');
      }
    } else if (prompt) {
      const embedData: PromptEmbed = {
        prompt_id: prompt.id,
        text: prompt.text,
        tags: prompt.tags,
      };

      const result = await sendMessage(selectedChannelId, {
        content: messageContent,
        embed_type: 'prompt',
        embed_data: embedData,
      });

      if (result) {
        toast.success('Shared to channel');
        onOpenChange(false);
        setComment('');
        setSelectedChannelId(null);
      } else {
        toast.error('Failed to share');
      }
    }

    setIsSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share to Channel</DialogTitle>
          <DialogDescription>
            {generation
              ? 'Share this generation to a chat channel.'
              : 'Share this prompt to a chat channel.'}
          </DialogDescription>
        </DialogHeader>

        {/* Channel selector */}
        <div className="space-y-2">
          <Label>Select Channel</Label>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : channels.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No channels available.
            </p>
          ) : (
            <ScrollArea className="h-[200px] border rounded-md">
              <div className="p-1">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setSelectedChannelId(channel.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      selectedChannelId === channel.id &&
                        'bg-primary/10 text-primary'
                    )}
                  >
                    {channel.access_level === 'restricted' ? (
                      <Lock className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Hash className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate">{channel.name}</span>
                    {selectedChannelId === channel.id && (
                      <Check className="h-4 w-4 ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Optional comment */}
        <div className="space-y-2">
          <Label htmlFor="share-comment">Comment (optional)</Label>
          <Input
            id="share-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            maxLength={4000}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={!selectedChannelId || isSending}
          >
            {isSending ? 'Sharing...' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
