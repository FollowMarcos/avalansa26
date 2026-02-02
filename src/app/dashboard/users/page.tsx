import { getAllProfiles } from '@/utils/supabase/admin';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { UsersManager } from '@/components/dashboard/users-manager';
import { Button } from '@/components/ui/button';
import { UserPlus, Download } from 'lucide-react';

export default async function UsersPage() {
  const profilesData = await getAllProfiles({ page: 1, limit: 10 });

  return (
    <DashboardPage>
      <DashboardHeader
        title="User Management"
        description="Manage all registered users, roles, and permissions."
        actions={
          <>
            <Button variant="outline" className="h-9 gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button className="h-9 gap-2 bg-primary text-primary-foreground hover:opacity-90">
              <UserPlus className="w-4 h-4" /> Add User
            </Button>
          </>
        }
      />
      <UsersManager
        initialProfiles={profilesData.profiles}
        initialTotal={profilesData.total}
        initialPage={profilesData.page}
        initialTotalPages={profilesData.totalPages}
      />
    </DashboardPage>
  );
}
