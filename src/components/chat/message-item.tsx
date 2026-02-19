'use client';

import * as React from 'react';
import { useState } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { deleteMessage as deleteChannelMessage } from '@/utils/supabase/chat-messages.server';
import { deleteDmMessage } from '@/utils/supabase/chat-dms.server';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Reply,
  Pencil,
  Trash2,
  Copy,
  SmilePlus,
} from 'lucide-react';
import { MessageEmbed } from './message-embed';
import type { ChatMessage, ChatDmMessage } from '@/types/chat';
import { toast } from 'sonner';

interface MessageItemProps {
  message: ChatMessage | ChatDmMessage;
  isGrouped: boolean;
  currentUserId: string | null;
  currentUserRole: string;
}

export const MessageItem = React.memo(function MessageItem({
  message,
  isGrouped,
  currentUserId,
  currentUserRole,
}: MessageItemProps) {
  const setReplyingTo = useChatStore((s) => s.setReplyingTo);
  const [isHovered, setIsHovered] = useState(false);

  const profile = message.profile;
  const displayName = profile?.username ?? 'Unknown';
  const isAdmin = profile?.role === 'admin';
  const time = formatTime(new Date(message.created_at));

  const isOwnMessage = currentUserId === message.user_id;
  const canDelete = isOwnMessage || currentUserRole === 'admin';

  // Deleted message
  if (message.is_deleted) {
    return (
      <div
        className={cn('px-2 py-0.5', !isGrouped && 'mt-3')}
        role="article"
        aria-label="Deleted message"
      >
        <p className="text-xs text-muted-foreground italic">
          Message deleted
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Copied to clipboard');
  };

  const handleDelete = async () => {
    if ('channel_id' in message) {
      await deleteChannelMessage(message.id);
    } else {
      await deleteDmMessage(message.id);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            'group relative px-2 py-0.5 rounded-md transition-colors',
            'hover:bg-accent/50',
            !isGrouped && 'mt-3'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          role="article"
          aria-label={`Message from ${displayName}`}
        >
          {/* Full message (with avatar) */}
          {!isGrouped && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 mt-0.5 flex-shrink-0">
                <AvatarImage
                  src={profile?.avatar_url ?? undefined}
                  alt={displayName}
                />
                <AvatarFallback className="text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      'font-semibold text-sm',
                      isAdmin && 'text-primary'
                    )}
                  >
                    {displayName}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] font-bold uppercase px-1 py-0.5 rounded bg-primary/10 text-primary">
                      Admin
                    </span>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <time
                        className="text-xs text-muted-foreground"
                        dateTime={message.created_at}
                      >
                        {time}
                      </time>
                    </TooltipTrigger>
                    <TooltipContent>
                      {new Date(message.created_at).toLocaleString()}
                    </TooltipContent>
                  </Tooltip>
                  {message.is_edited && (
                    <span className="text-[10px] text-muted-foreground">
                      (edited)
                    </span>
                  )}
                </div>
                <MessageContent content={message.content} />
                {message.embed_type && message.embed_data && (
                  <MessageEmbed
                    type={message.embed_type}
                    data={message.embed_data}
                  />
                )}
                {message.attachments.length > 0 && (
                  <MessageAttachments attachments={message.attachments} />
                )}
              </div>
            </div>
          )}

          {/* Grouped message (no avatar, just content) */}
          {isGrouped && (
            <div className="pl-11">
              {/* Show time on hover */}
              <span
                className={cn(
                  'absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground transition-opacity',
                  isHovered ? 'opacity-100' : 'opacity-0'
                )}
              >
                {time}
              </span>
              <MessageContent content={message.content} />
              {message.embed_type && message.embed_data && (
                <MessageEmbed
                  type={message.embed_type}
                  data={message.embed_data}
                />
              )}
              {message.attachments.length > 0 && (
                <MessageAttachments attachments={message.attachments} />
              )}
            </div>
          )}

          {/* Hover actions */}
          {isHovered && (
            <div className="absolute -top-3 right-2 flex items-center gap-0.5 bg-background border border-border rounded-md shadow-sm px-0.5 py-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setReplyingTo(message)}
                    aria-label="Reply"
                  >
                    <Reply className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reply</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopy}
                    aria-label="Copy message"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => setReplyingTo(message)}>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Text
        </ContextMenuItem>
        {canDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Message
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
});

// ============================================
// Sub-components
// ============================================

function MessageContent({ content }: { content: string }) {
  return (
    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
      {content}
    </p>
  );
}

function MessageAttachments({
  attachments,
}: {
  attachments: ChatMessage['attachments'];
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {attachments.map((attachment) => {
        const isImage = attachment.content_type.startsWith('image/');

        if (isImage) {
          return (
            <a
              key={attachment.id}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden border border-border max-w-sm hover:opacity-90 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment.url}
                alt={attachment.filename}
                className="max-h-[300px] w-auto object-contain"
                loading="lazy"
              />
            </a>
          );
        }

        return (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm hover:bg-muted transition-colors"
          >
            <span className="truncate max-w-[200px]">
              {attachment.filename}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatFileSize(attachment.size)}
            </span>
          </a>
        );
      })}
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
