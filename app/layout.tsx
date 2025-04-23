import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';

import { Providers } from '@/components/providers';
import { ClientLayout } from '@/components/providers/client-layout';
import { PageHeader } from '@/components/layout/page-header';

import './globals.css';

export const metadata: Metadata = {
  title: 'Valmira.xyz Dashboard',
  description: 'Manage your crypto projects and trading bots',
  generator: 'v0.dev',
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookies = headers().get('cookie');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers cookies={cookies}>
          <div className="min-h-screen flex flex-col">
            <PageHeader />
            <main className="flex-1">
              <ClientLayout>{children}</ClientLayout>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
