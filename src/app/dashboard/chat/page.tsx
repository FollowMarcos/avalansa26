import { ChannelManager } from '@/components/dashboard/chat/channel-manager';
import { PermissionsManager } from '@/components/dashboard/chat/permissions-manager';
import { getAllChannels } from '@/utils/supabase/chat-channels.server';
import { getAllPermissions } from '@/utils/supabase/chat-permissions.server';
import { createClient } from '@/utils/supabase/server';

export const metadata = {
  title: 'Chat Management — Dashboard',
};

export default async function ChatDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  const [channels, permissions] = await Promise.all([
    getAllChannels(),
    isAdmin ? getAllPermissions() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chat Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create and manage chat channels. Control who can access each channel.
        </p>
      </div>

      <ChannelManager initialChannels={channels} />

      {isAdmin && (
        <PermissionsManager initialPermissions={permissions} />
      )}
    </div>
  );
}
