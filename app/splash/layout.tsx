import React from 'react';

import { Inter } from 'next/font/google';
import { headers } from 'next/headers';

import { Providers } from '@/components/providers';

import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Valmira.xyz - Login',
  description: 'Login to access Valmira dashboard',
};

export default function SplashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookies = headers().get('cookie');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className}`}>
        <Providers cookies={cookies}>
          <div className="min-h-screen w-full bg-gray-100 dark:bg-gray-900">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
