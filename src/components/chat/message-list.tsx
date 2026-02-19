'use client';

import * as React from 'react';
import { useChatScroll } from '@/hooks/use-chat-scroll';
import { MessageItem } from './message-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowDown, Loader2 } from 'lucide-react';
import type { ChatMessage, ChatDmMessage } from '@/types/chat';

interface MessageListProps {
  messages: (ChatMessage | ChatDmMessage)[];
  onLoadMore?: () => void;
  isLoadingMore: boolean;
  currentUserId: string | null;
  currentUserRole: string;
}

export function MessageList({
  messages,
  onLoadMore,
  isLoadingMore,
  currentUserId,
  currentUserRole,
}: MessageListProps) {
  const { scrollRef, showScrollButton, scrollToBottom } = useChatScroll({
    messageCount: messages.length,
  });

  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Intersection observer for infinite scroll (load older messages)
  React.useEffect(() => {
    if (!onLoadMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, isLoadingMore]);

  // Initial scroll to bottom
  React.useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => scrollToBottom('instant'));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto px-4 py-2"
        role="log"
        aria-label="Messages"
        aria-live="polite"
      >
        {/* Sentinel for loading older messages */}
        {onLoadMore && (
          <div ref={sentinelRef} className="h-1">
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Messages grouped by date */}
        {groupedMessages.map(([dateLabel, msgs]) => (
          <div key={dateLabel}>
            <DateDivider label={dateLabel} />
            {msgs.map((message, index) => {
              const prevMessage = index > 0 ? msgs[index - 1] : null;
              const isGrouped = shouldGroupWithPrevious(message, prevMessage);

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  isGrouped={isGrouped}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full shadow-lg gap-1.5"
            onClick={() => scrollToBottom('smooth')}
          >
            <ArrowDown className="h-3.5 w-3.5" />
            New messages
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Date Divider
// ============================================

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4" role="separator">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium px-2">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function groupMessagesByDate(
  messages: (ChatMessage | ChatDmMessage)[]
): [string, (ChatMessage | ChatDmMessage)[]][] {
  const groups = new Map<string, (ChatMessage | ChatDmMessage)[]>();

  for (const msg of messages) {
    const label = getDateLabel(new Date(msg.created_at));
    const list = groups.get(label) ?? [];
    list.push(msg);
    groups.set(label, list);
  }

  return Array.from(groups.entries());
}

function getDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const messageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (messageDate.getTime() === today.getTime()) return 'Today';
  if (messageDate.getTime() === yesterday.getTime()) return 'Yesterday';

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year:
      date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }).format(date);
}

/** Group consecutive messages from the same user within 5 minutes. */
function shouldGroupWithPrevious(
  current: ChatMessage | ChatDmMessage,
  previous: (ChatMessage | ChatDmMessage) | null
): boolean {
  if (!previous) return false;
  if (previous.user_id !== current.user_id) return false;

  const timeDiff =
    new Date(current.created_at).getTime() -
    new Date(previous.created_at).getTime();

  return timeDiff < 5 * 60 * 1000; // 5 minutes
}
