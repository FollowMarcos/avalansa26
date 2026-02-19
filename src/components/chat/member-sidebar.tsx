'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { getChannelMembers } from '@/utils/supabase/chat-channels.server';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: string;
}

export function MemberSidebar() {
  const activeChannelId = useChatStore((s) => s.activeChannelId);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeChannelId) {
      setMembers([]);
      return;
    }

    async function loadMembers() {
      setIsLoading(true);
      const data = await getChannelMembers(activeChannelId!);
      setMembers(data);
      setIsLoading(false);
    }

    loadMembers();
  }, [activeChannelId]);

  const admins = members.filter((m) => m.role === 'admin');
  const users = members.filter((m) => m.role !== 'admin');

  return (
    <aside className="w-60 border-l border-border bg-muted/30 flex flex-col">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Members — {members.length}
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-xs">
              Loading...
            </div>
          ) : members.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-xs">
              No members yet.
            </div>
          ) : (
            <>
              {admins.length > 0 && (
                <MemberGroup label="Admins" members={admins} />
              )}
              {users.length > 0 && (
                <MemberGroup
                  label="Members"
                  members={users}
                />
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

function MemberGroup({
  label,
  members,
}: {
  label: string;
  members: Member[];
}) {
  return (
    <div className="mb-4">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
        {label} — {members.length}
      </h3>
      <div className="space-y-0.5">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={member.avatar_url ?? undefined}
                alt={member.username ?? 'User'}
              />
              <AvatarFallback className="text-[10px]">
                {(member.username ?? 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                'text-sm truncate',
                member.role === 'admin' && 'font-medium text-primary'
              )}
            >
              {member.username ?? 'Unknown'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
