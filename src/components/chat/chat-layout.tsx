'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { getAccessibleChannels } from '@/utils/supabase/chat-channels.server';
import { getDmThreads } from '@/utils/supabase/chat-dms.server';
import { getUnreadCounts } from '@/utils/supabase/chat-read-state.server';
import { ChannelSidebar } from './channel-sidebar';
import { MessageArea } from './message-area';
import { MemberSidebar } from './member-sidebar';
import { CreateProvider } from '@/components/create/create-context';
import { SiteDock } from '@/components/layout/site-dock';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function ChatLayout() {
  const {
    activeChannelId,
    activeDmThreadId,
    memberSidebarOpen,
    setChannels,
    setDmThreads,
    setUnreadCounts,
    setActiveChannel,
    setIsLoadingChannels,
  } = useChatStore();

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoadingChannels(true);

      const [channels, threads, unreads] = await Promise.all([
        getAccessibleChannels(),
        getDmThreads(),
        getUnreadCounts(),
      ]);

      setChannels(channels);
      setDmThreads(threads);
      setUnreadCounts(unreads);

      // Auto-select first channel if none selected
      if (!activeChannelId && !activeDmThreadId && channels.length > 0) {
        setActiveChannel(channels[0].id);
      }

      setIsLoadingChannels(false);
    }

    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CreateProvider>
      <TooltipProvider delayDuration={300}>
        <div className="relative flex h-dvh bg-background text-foreground overflow-hidden">
          {/* Dock — vertical left position */}
          <div className="fixed top-0 left-0 bottom-0 z-[60] p-3 flex items-center pointer-events-none">
            <SiteDock vertical />
          </div>

          {/* Main chat area — offset for dock */}
          <div className="flex flex-1 pl-20">
            {/* Channel sidebar */}
            <ChannelSidebar />

            {/* Message area */}
            <div className="flex-1 flex flex-col min-w-0">
              <MessageArea />
            </div>

            {/* Member sidebar (collapsible) */}
            <div
              className={cn(
                'transition-all duration-200 ease-in-out overflow-hidden',
                memberSidebarOpen ? 'w-60' : 'w-0'
              )}
            >
              {memberSidebarOpen && <MemberSidebar />}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </CreateProvider>
  );
}
