import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ApiManager } from '@/components/dashboard/api-manager';
import { Card, CardContent } from '@/components/ui/card';

export default function ApisPage() {
  return (
    <DashboardPage>
      <DashboardHeader
        title="API Configuration"
        description="Manage AI APIs for image generation and other features."
      />
      <Card className="border-border/50 bg-card/30 backdrop-blur-md overflow-hidden">
        <CardContent className="p-6">
          <ApiManager />
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
