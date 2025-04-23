'use client';

import type React from 'react';

import { Bell } from 'lucide-react';
import { AlignJustify } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ProjectSearch } from '@/components/projects/project-search';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import Logo from '@/public/sidebar/logo.svg';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/portfolio': 'Portfolio',
  '/swap': 'Swap',
  '/public-projects': 'All Projects',
  '/tutorials': 'Tutorials & Resources',
  '/faqs': 'FAQs',
  '/ambassador': 'Ambassador Program',
  '/settings': 'Settings',
  // Add more page titles as needed
};

interface PageHeaderProps {
  children?: React.ReactNode;
}

export function PageHeader({ children }: PageHeaderProps) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] || 'Project';
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
          <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-4">
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
    </>
  );
}
