import { PageShell } from '@/components/layout/page-shell';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageShell contentClassName="bg-background">
      <DashboardLayout>{children}</DashboardLayout>
    </PageShell>
  );
}
