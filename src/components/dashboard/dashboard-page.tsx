interface DashboardPageProps {
  children: React.ReactNode;
}

export function DashboardPage({ children }: DashboardPageProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground p-4 pt-6 lg:p-8 space-y-8 max-w-[2000px]">
      {children}
    </div>
  );
}
