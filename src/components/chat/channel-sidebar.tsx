'use client';

import * as React from 'react';
import { useChatStore } from '@/stores/chat-store';
import { cn } from '@/lib/utils';
import { Hash, Lock, MessageCircle } from 'lucide-react';
import type { ChatChannel, DmThread } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ChannelSidebar() {
  const {
    channels,
    dmThreads,
    activeChannelId,
    activeDmThreadId,
    sidebarView,
    unreadCounts,
    setActiveChannel,
    setActiveDmThread,
    setSidebarView,
  } = useChatStore();

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col">
      {/* View toggle */}
      <div className="p-3 border-b border-border">
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setSidebarView('channels')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-colors',
              sidebarView === 'channels'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Hash className="h-3.5 w-3.5" />
            Channels
          </button>
          <button
            type="button"
            onClick={() => setSidebarView('dms')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-colors relative',
              sidebarView === 'dms'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            DMs
            <DmUnreadBadge />
          </button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sidebarView === 'channels' ? (
            <ChannelList
              channels={channels}
              activeId={activeChannelId}
              unreadCounts={unreadCounts}
              onSelect={setActiveChannel}
            />
          ) : (
            <DmList
              threads={dmThreads}
              activeId={activeDmThreadId}
              unreadCounts={unreadCounts}
              onSelect={setActiveDmThread}
            />
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

// ============================================
// Channel List
// ============================================

function ChannelList({
  channels,
  activeId,
  unreadCounts,
  onSelect,
}: {
  channels: ChatChannel[];
  activeId: string | null;
  unreadCounts: Map<string, number>;
  onSelect: (id: string) => void;
}) {
  if (channels.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-xs">
        No channels available.
      </div>
    );
  }

  return (
    <div className="space-y-0.5" role="listbox" aria-label="Channels">
      {channels.map((channel) => {
        const isActive = channel.id === activeId;
        const unread = unreadCounts.get(channel.id) ?? 0;
        const isRestricted = channel.access_level === 'restricted';

        return (
          <Tooltip key={channel.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => onSelect(channel.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  isActive && 'bg-accent text-accent-foreground font-medium',
                  !isActive && unread > 0 && 'font-semibold text-foreground'
                )}
              >
                {isRestricted ? (
                  <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <Hash className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{channel.name}</span>
                {unread > 0 && (
                  <span className="ml-auto flex-shrink-0 min-w-5 h-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            {channel.topic && (
              <TooltipContent side="right" className="max-w-[200px]">
                {channel.topic}
              </TooltipContent>
            )}
          </Tooltip>
        );
      })}
    </div>
  );
}

// ============================================
// DM List
// ============================================

function DmList({
  threads,
  activeId,
  unreadCounts,
  onSelect,
}: {
  threads: DmThread[];
  activeId: string | null;
  unreadCounts: Map<string, number>;
  onSelect: (id: string) => void;
}) {
  if (threads.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-xs">
        No conversations yet.
      </div>
    );
  }

  return (
    <div className="space-y-0.5" role="listbox" aria-label="Direct Messages">
      {threads.map((thread) => {
        const isActive = thread.id === activeId;
        const unread = unreadCounts.get(thread.id) ?? 0;
        const otherUser = thread.other_user;
        const displayName = otherUser?.username ?? 'Unknown';
        const lastMessage = thread.last_message;

        return (
          <button
            key={thread.id}
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={() => onSelect(thread.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              isActive && 'bg-accent text-accent-foreground',
              !isActive && unread > 0 && 'font-semibold'
            )}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={otherUser?.avatar_url ?? undefined} alt={displayName} />
              <AvatarFallback className="text-xs">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <div className="truncate font-medium">{displayName}</div>
              {lastMessage && (
                <div className="truncate text-xs text-muted-foreground">
                  {lastMessage.is_deleted
                    ? 'Message deleted'
                    : lastMessage.content}
                </div>
              )}
            </div>
            {unread > 0 && (
              <span className="flex-shrink-0 min-w-5 h-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// DM Unread Badge
// ============================================

function DmUnreadBadge() {
  const dmThreads = useChatStore((s) => s.dmThreads);
  const unreadCounts = useChatStore((s) => s.unreadCounts);

  const totalDmUnread = dmThreads.reduce(
    (sum, t) => sum + (unreadCounts.get(t.id) ?? 0),
    0
  );

  if (totalDmUnread === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
      {totalDmUnread > 9 ? '9+' : totalDmUnread}
    </span>
  );
}
