import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DockManager } from '@/components/dashboard/dock-manager';
import { Card, CardContent } from '@/components/ui/card';

export default function DockPage() {
  return (
    <DashboardPage>
      <DashboardHeader
        title="Site Dock"
        description="Manage the navigation dock, rearrange icons, and configure dropdowns."
      />
      <Card className="border-border/50 bg-card/30 backdrop-blur-md overflow-hidden">
        <CardContent className="p-6">
          <DockManager />
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
