'use client';

import { ReactNode } from 'react';

import { usePathname } from 'next/navigation';

import WebSocketProvider from '@/app/websocket-provider';
import { useProjectSync } from '@/hooks/use-project-sync';

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isSplashPage = pathname === '/splash';

  // Initialize project sync only for non-splash pages
  if (!isSplashPage) {
    useProjectSync();
  }

  // For splash page, return just the children without WebSocketProvider
  if (isSplashPage) {
    return <>{children}</>;
  }

  // For other pages, wrap with WebSocketProvider
  return <WebSocketProvider>{children}</WebSocketProvider>;
}
