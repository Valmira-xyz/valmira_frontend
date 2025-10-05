'use client';

import { ReactNode } from 'react';

import { usePathname } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { ClientLayout } from '@/components/providers/client-layout';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const isSplashPage = pathname === '/splash';

  const isEmbedPage = pathname.startsWith('/embed');

  // For splash page, just render children
  if (isSplashPage || isEmbedPage) {
    return <>{children}</>;
  }

  // For all other pages, wrap with dashboard layout elements
  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1">
        <ClientLayout>{children}</ClientLayout>
      </main>
    </div>
  );
}
