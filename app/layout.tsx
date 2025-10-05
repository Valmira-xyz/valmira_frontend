import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { headers } from 'next/headers';

import { Providers } from '@/components/providers';
import { FontStatusProvider } from '@/hooks/use-font-loader';
import { ttAutonomous } from '@/lib/fonts';

import './globals.css';

export const metadata: Metadata = {
  title: 'Valmira.xyz Dashboard',
  description: 'Manage your crypto projects and trading bots',
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

const inter = Inter({
  subsets: ['latin'],
  display: 'block',
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'block',
  variable: '--font-poppins',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookies = headers().get('cookie');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload the custom font */}
        {/* <link
          rel="preload"
          href="/TTAutonomousVariable.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        /> */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${ttAutonomous.variable} ${inter.variable} ${poppins.variable} font-sans`}
      >
        <FontStatusProvider>
          <Providers cookies={cookies}>{children}</Providers>
        </FontStatusProvider>
      </body>
    </html>
  );
}
