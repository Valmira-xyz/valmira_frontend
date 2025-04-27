import React from 'react';

import { Inter } from 'next/font/google';
import { headers } from 'next/headers';

import { Providers } from '@/components/providers';

import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function SplashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookies = headers().get('cookie');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`bg-gray-100 dark:bg-gray-900 ${inter.className}`}>
        <Providers cookies={cookies}>
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
