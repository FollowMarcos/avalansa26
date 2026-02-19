'use client';

import * as React from 'react';
import { useRef, useState, useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { sendMessage } from '@/utils/supabase/chat-messages.server';
import { sendDmMessage } from '@/utils/supabase/chat-dms.server';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import type { MessageAttachment, ChatMessageInsert } from '@/types/chat';

interface MessageInputProps {
  channelId: string | null;
  dmThreadId: string | null;
  channelName?: string;
  dmUsername?: string | null;
}

export function MessageInput({
  channelId,
  dmThreadId,
  channelName,
  dmUsername,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { replyingTo, setReplyingTo, addChannelMessage, addDmMessage } =
    useChatStore();

  const placeholder = channelName
    ? `Message #${channelName}`
    : dmUsername
      ? `Message @${dmUsername}`
      : 'Type a message...';

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;
    if (isSending) return;

    setIsSending(true);

    const messageData: ChatMessageInsert = {
      content: trimmed || '\u200B', // Zero-width space if only attachments
      attachments,
      reply_to_id: replyingTo?.id,
    };

    try {
      if (channelId) {
        const msg = await sendMessage(channelId, messageData);
        if (!msg) {
          toast.error('Failed to send message');
          return;
        }
      } else if (dmThreadId) {
        const msg = await sendDmMessage(dmThreadId, messageData);
        if (!msg) {
          toast.error('Failed to send message');
          return;
        }
      }

      setContent('');
      setAttachments([]);
      setReplyingTo(null);
      textareaRef.current?.focus();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [
    content,
    attachments,
    isSending,
    channelId,
    dmThreadId,
    replyingTo,
    setReplyingTo,
    addChannelMessage,
    addDmMessage,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      // Validate file size (25MB max)
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`File too large: ${file.name} (max 25MB)`);
        continue;
      }

      // Upload via chat upload API
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.message ?? 'Upload failed');
          continue;
        }

        const data = await response.json();

        setAttachments((prev) => [
          ...prev,
          {
            id: data.id,
            filename: file.name,
            content_type: file.type,
            size: file.size,
            url: data.url,
            path: data.path,
            width: data.width,
            height: data.height,
          },
        ]);
      } catch {
        toast.error(`Failed to upload: ${file.name}`);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="flex-shrink-0 border-t border-border p-4">
      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-md bg-muted/50 border-l-2 border-primary">
          <span className="text-xs text-muted-foreground">
            Replying to{' '}
            <span className="font-semibold text-foreground">
              {replyingTo.profile?.username ?? 'Unknown'}
            </span>
          </span>
          <span className="text-xs text-muted-foreground truncate flex-1">
            {replyingTo.content}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setReplyingTo(null)}
            aria-label="Cancel reply"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs"
            >
              <span className="truncate max-w-[150px]">
                {attachment.filename}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => removeAttachment(attachment.id)}
                aria-label={`Remove ${attachment.filename}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.zip"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            maxLength={4000}
            className={cn(
              'w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'min-h-[36px] max-h-[200px]'
            )}
            aria-label="Message input"
          />
        </div>

        {/* Send button */}
        <Button
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={handleSubmit}
          disabled={
            isSending || (content.trim().length === 0 && attachments.length === 0)
          }
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Character count (when approaching limit) */}
      {content.length > 3500 && (
        <div
          className={cn(
            'text-right text-xs mt-1',
            content.length > 3900
              ? 'text-destructive'
              : 'text-muted-foreground'
          )}
        >
          {content.length}/4000
        </div>
      )}
    </div>
  );
}
