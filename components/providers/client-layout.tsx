'use client';

import { ReactNode } from 'react';

import { useProjectSync } from '@/hooks/use-project-sync';

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  // Initialize project sync
  useProjectSync();

  return <>{children}</>;
}
