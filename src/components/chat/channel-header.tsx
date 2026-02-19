'use client';

import * as React from 'react';
import { useChatStore } from '@/stores/chat-store';
import { Hash, Lock, Users, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ChatChannel, DmThread } from '@/types/chat';

interface ChannelHeaderProps {
  channel?: ChatChannel;
  dmThread?: DmThread;
}

export function ChannelHeader({ channel, dmThread }: ChannelHeaderProps) {
  const { memberSidebarOpen, setMemberSidebarOpen } = useChatStore();

  if (channel) {
    const isRestricted = channel.access_level === 'restricted';

    return (
      <header className="h-12 flex-shrink-0 border-b border-border flex items-center px-4 gap-3">
        {isRestricted ? (
          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <h1 className="font-semibold text-sm truncate">{channel.name}</h1>

        {channel.topic && (
          <>
            <div className="w-px h-4 bg-border flex-shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              {channel.topic}
            </p>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMemberSidebarOpen(!memberSidebarOpen)}
                aria-label={
                  memberSidebarOpen ? 'Hide members' : 'Show members'
                }
              >
                {memberSidebarOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {memberSidebarOpen ? 'Hide members' : 'Show members'}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    );
  }

  if (dmThread) {
    const otherUser = dmThread.other_user;
    const displayName = otherUser?.username ?? 'Unknown';

    return (
      <header className="h-12 flex-shrink-0 border-b border-border flex items-center px-4 gap-3">
        <Avatar className="h-6 w-6">
          <AvatarImage
            src={otherUser?.avatar_url ?? undefined}
            alt={displayName}
          />
          <AvatarFallback className="text-xs">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h1 className="font-semibold text-sm">{displayName}</h1>
      </header>
    );
  }

  return null;
}
