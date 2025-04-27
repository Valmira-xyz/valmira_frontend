'use client';

import type React from 'react';

import { usePathname } from 'next/navigation';

import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSplashPage = pathname === '/splash';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {!isSplashPage && <DashboardSidebar />}
        <div className="flex flex-col flex-1">
          <main className="flex-1 p-4 md:p-6 bg-muted/40">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
