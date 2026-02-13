'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  DashboardSidebar,
  MobileMenuTrigger,
  useSidebar,
} from './dashboard-sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <>
      <DashboardSidebar />

      {/* Main content area */}
      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 64 : 240) : 0,
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="min-h-dvh flex flex-col"
      >
        {/* Mobile header with menu trigger */}
        <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center gap-4 px-4 border-b border-border/50 bg-background/95 backdrop-blur-md">
          <MobileMenuTrigger />
          <span className="font-semibold text-sm">Dashboard</span>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </motion.div>
    </>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <DashboardContent>{children}</DashboardContent>
      </Suspense>
    </SidebarProvider>
  );
}
