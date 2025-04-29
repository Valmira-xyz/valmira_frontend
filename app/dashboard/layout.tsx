'use client';

import type React from 'react';

import { usePathname } from 'next/navigation';

import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { motion } from 'framer-motion';
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSplashPage = pathname === '/splash';

  return (
    <SidebarProvider>
      <motion.div
        className="flex min-h-screen"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {!isSplashPage && <DashboardSidebar />}
        <div className="flex flex-col flex-1">
          <main className="flex-1 p-4 md:p-6 bg-muted/40">{children}</main>
        </div>
      </motion.div>
    </SidebarProvider>
  );
}
