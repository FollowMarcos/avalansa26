import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { CreateManager } from '@/components/dashboard/create-manager';
import { Card, CardContent } from '@/components/ui/card';

export default function CreateSettingsPage() {
  return (
    <DashboardPage>
      <DashboardHeader
        title="Create Feature Settings"
        description="Control image generation options, quality limits, and maintenance mode."
      />
      <Card className="border-border/50 bg-card/30 backdrop-blur-md overflow-hidden">
        <CardContent className="p-6">
          <CreateManager />
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
