import { getAllProfiles, getAdminStats } from '@/utils/supabase/admin';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { PageShell } from '@/components/layout/page-shell';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export default async function DashboardPage() {
  const [profilesData, stats] = await Promise.all([
    getAllProfiles({ page: 1, limit: 10 }),
    getAdminStats(),
  ]);

  return (
    <PageShell contentClassName="bg-background">
      <DashboardLayout>
        <DashboardClient
          initialProfiles={profilesData.profiles}
          initialStats={stats}
          initialTotal={profilesData.total}
          initialPage={profilesData.page}
          initialTotalPages={profilesData.totalPages}
        />
      </DashboardLayout>
    </PageShell>
  );
}
