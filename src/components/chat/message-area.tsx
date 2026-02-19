'use client';

import * as React from 'react';
import { useEffect, useCallback, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useChatStore } from '@/stores/chat-store';
import { getMessages } from '@/utils/supabase/chat-messages.server';
import { getDmMessages } from '@/utils/supabase/chat-dms.server';
import { markAsRead } from '@/utils/supabase/chat-read-state.server';
import { useChatRealtime, useDmRealtime } from '@/hooks/use-chat-realtime';
import { ChannelHeader } from './channel-header';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Loader2 } from 'lucide-react';

const MESSAGE_PAGE_SIZE = 50;

export function MessageArea() {
  const {
    activeChannelId,
    activeDmThreadId,
    channels,
    dmThreads,
    channelMessages,
    dmMessages,
    isLoadingMessages,
    setChannelMessages,
    setDmMessages,
    setIsLoadingMessages,
    setIsLoadingMoreMessages,
    setHasMoreMessages,
    prependChannelMessages,
    prependDmMessages,
    isLoadingMoreMessages,
    hasMoreMessages,
  } = useChatStore();

  // Get current user for ownership checks
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.role) setCurrentUserRole(data.role);
          });
      }
    });
  }, []);

  // Subscribe to Realtime updates
  useChatRealtime(activeChannelId);
  useDmRealtime(activeDmThreadId);

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeDm = dmThreads.find((t) => t.id === activeDmThreadId);

  const currentMessages = activeChannelId
    ? channelMessages.get(activeChannelId) ?? []
    : activeDmThreadId
      ? dmMessages.get(activeDmThreadId) ?? []
      : [];

  // Load messages when active channel/DM changes
  useEffect(() => {
    async function load() {
      if (activeChannelId) {
        // Only load if not already cached
        if (!channelMessages.has(activeChannelId)) {
          setIsLoadingMessages(true);
          const msgs = await getMessages(activeChannelId, {
            limit: MESSAGE_PAGE_SIZE,
          });
          setChannelMessages(activeChannelId, msgs);
          setHasMoreMessages(activeChannelId, msgs.length >= MESSAGE_PAGE_SIZE);
          setIsLoadingMessages(false);
        }
        // Mark as read
        await markAsRead({ channelId: activeChannelId });
      } else if (activeDmThreadId) {
        if (!dmMessages.has(activeDmThreadId)) {
          setIsLoadingMessages(true);
          const msgs = await getDmMessages(activeDmThreadId, {
            limit: MESSAGE_PAGE_SIZE,
          });
          setDmMessages(activeDmThreadId, msgs);
          setHasMoreMessages(
            activeDmThreadId,
            msgs.length >= MESSAGE_PAGE_SIZE
          );
          setIsLoadingMessages(false);
        }
        await markAsRead({ dmThreadId: activeDmThreadId });
      }
    }

    load();
  }, [activeChannelId, activeDmThreadId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load older messages
  const loadMore = useCallback(async () => {
    const id = activeChannelId ?? activeDmThreadId;
    if (!id || isLoadingMoreMessages) return;

    const existingMessages = activeChannelId
      ? channelMessages.get(activeChannelId) ?? []
      : dmMessages.get(activeDmThreadId!) ?? [];

    if (existingMessages.length === 0) return;

    setIsLoadingMoreMessages(true);

    const oldestMessage = existingMessages[0];

    if (activeChannelId) {
      const older = await getMessages(activeChannelId, {
        limit: MESSAGE_PAGE_SIZE,
        before: oldestMessage.created_at,
      });
      prependChannelMessages(activeChannelId, older);
      setHasMoreMessages(activeChannelId, older.length >= MESSAGE_PAGE_SIZE);
    } else if (activeDmThreadId) {
      const older = await getDmMessages(activeDmThreadId, {
        limit: MESSAGE_PAGE_SIZE,
        before: oldestMessage.created_at,
      });
      prependDmMessages(activeDmThreadId, older);
      setHasMoreMessages(activeDmThreadId, older.length >= MESSAGE_PAGE_SIZE);
    }

    setIsLoadingMoreMessages(false);
  }, [
    activeChannelId,
    activeDmThreadId,
    channelMessages,
    dmMessages,
    isLoadingMoreMessages,
    prependChannelMessages,
    prependDmMessages,
    setHasMoreMessages,
    setIsLoadingMoreMessages,
  ]);

  // Empty state
  if (!activeChannelId && !activeDmThreadId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">Welcome to Chat</p>
          <p className="text-sm mt-1">
            Select a channel or conversation to get started.
          </p>
        </div>
      </div>
    );
  }

  const activeId = activeChannelId ?? activeDmThreadId!;
  const canLoadMore = hasMoreMessages.get(activeId) ?? false;

  return (
    <>
      <ChannelHeader channel={activeChannel} dmThread={activeDm} />

      <div className="flex-1 flex flex-col min-h-0">
        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MessageList
            messages={currentMessages}
            onLoadMore={canLoadMore ? loadMore : undefined}
            isLoadingMore={isLoadingMoreMessages}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        )}

        <MessageInput
          channelId={activeChannelId}
          dmThreadId={activeDmThreadId}
          channelName={activeChannel?.name}
          dmUsername={activeDm?.other_user?.username}
        />
      </div>
    </>
  );
}
