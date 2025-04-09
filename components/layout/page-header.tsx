'use client';

import type React from 'react';

import { Bell } from 'lucide-react';
import { AlignJustify } from 'lucide-react';
import Link from 'next/link';

import { ProjectSearch } from '@/components/projects/project-search';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import Logo from '@/public/sidebar/logo.svg';

interface PageHeaderProps {
  title: string;
  showSearch?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  showSearch = false,
  children,
}: PageHeaderProps) {
  const { openMobile, setOpenMobile, isMobile } = useSidebar();

  return (
    <>
      {isMobile && (
        <div className="flex items-center justify-between bg-sidebar p-4">
          <Link href={'/'}>
            <Logo />
          </Link>
          <AlignJustify onClick={() => setOpenMobile(!openMobile)} />
        </div>
      )}
      <div className="flex items-center justify-between px-4 md:px-6 border-b py-4 min-h-12 flex-wrap gap-2">
        <div className="flex items-center">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {showSearch && <ProjectSearch />}
          <div className={cn('flex items-center gap-4', isMobile && 'gap-2')}>
            {children}
            <Button
              variant="ghost"
              size="icon"
              className="relative border size-8"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-[-3px] right-[-2px] h-2 w-2 rounded-full bg-red-500" />
              <span className="sr-only">Notifications</span>
            </Button>
            <ThemeToggle className="size-8 border" />
          </div>
        </div>
      </div>
    </>
  );
}
