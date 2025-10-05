'use client';

import type React from 'react';
import { useSelector } from 'react-redux';

import { ThemeSwitch } from './theme-switch';
import { AlignJustify } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { PassiveSnipeNotification } from '@/components/projects/passive-snipe-notification';
// import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import Logo from '@/public/sidebar/logo.svg';
import { RootState } from '@/store/store';

// Configure which embed paths should hide the page header
const EMBED_WIDGET_PATHS = [
  '/embed/tokenboost',
  '/embed/widget',
  // Add more clean widget paths here in the future
  // '/embed/new-widget',
  // '/embed/partner-widget',
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/portfolio': 'Portfolio',
  '/swap': 'Swap',
  '/public-projects': 'All Projects',
  '/public-packs': 'All Projects with Packs',
  '/packs': 'Your Projects with Packs',
  '/projects': 'Your Projects',
  '/tutorials': 'Tutorials & Resources',
  '/faqs': 'FAQs',
  '/ambassador-program/overview': 'Ambassador Program',
  '/ambassador-program/referral': 'Referrals',
  '/ambassador-program/widget-config': 'Widget Config',
  '/ambassador-program/widget-preview': 'Widget Preview',
  '/ambassador/referral': 'Referrals',
  '/ambassador': 'Ambassadors',
  '/ambassador/widget-config': 'Widget Config',
  '/ambassador/widget-preview': 'Widget Preview',
  '/settings': 'Settings',
  // Add more page titles as needed
};

interface PageHeaderProps {
  children?: React.ReactNode;
}

export function PageHeader({ children }: PageHeaderProps) {
  const pathname = usePathname();

  // Function to determine page title based on pathname
  const getPageTitle = (path: string): string => {
    // Check for exact matches first
    if (pageTitles[path]) {
      return pageTitles[path];
    }

    // Check for dynamic routes
    if (path.startsWith('/packs/') && path.split('/').length === 3) {
      // Path like /packs/[id]
      return 'Pack';
    }

    if (path.startsWith('/projects/') && path.split('/').length === 3) {
      // Path like /projects/[id]
      return 'Project';
    }

    // Default fallback
    return 'Project';
  };

  const pageTitle = getPageTitle(pathname);
  const { openMobile, setOpenMobile, isMobile } = useSidebar();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const userId = user?._id;

  // Don't render the header on the splash page or embed widget pages
  if (pathname === '/splash' || EMBED_WIDGET_PATHS.includes(pathname)) {
    return null;
  }

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
          <h1 className="text-2xl font-bold tracking-tight font-tt ">
            {pageTitle}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {children}
          {isAuthenticated && userId && (
            <div
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className: 'relative border size-8',
              })}
            >
              {/* <Bell className="h-5 w-5" /> */}
              {/* <span className="absolute top-[-3px] right-[-2px] h-2 w-2 rounded-full bg-red-500" /> */}
              <PassiveSnipeNotification userId={userId} />
              <span className="sr-only">Notifications</span>
            </div>
          )}
          {isAuthenticated && userId && (
            <div className="w-px h-6 bg-gray-400 " />
          )}
          <ThemeSwitch />
        </div>
      </div>
    </>
  );
}
