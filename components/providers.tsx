'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import { type Config, cookieToInitialState, WagmiProvider } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';

import { AuthProvider } from '@/components/AuthProvider';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { QueryProvider } from '@/components/query-provider';
import { SessionProvider } from '@/components/session-provider';
import SocketProvider from '@/components/socket-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { WalletProvider } from '@/components/wallet/wallet-provider';
import { networks, projectId, wagmiAdapter } from '@/lib/walletConfig';
import { store } from '@/store/store';

if (!projectId) {
  throw new Error('Project ID is not defined');
}

// Set up metadata
const metadata = {
  name: 'valmira_frontend',
  description: 'The first innovated multi chain meme launchpad',
  url: process.env.NEXT_PUBLIC_PROJECT_URL || 'https://reown.com/appkit', // origin must match your domain & subdomain
  icons: ['https://assets.reown.com/reown-profile-pic.png'],
};

// Create the modal

export const appkit = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: networks,
  defaultNetwork: networks[1],
  metadata: metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});

export function Providers({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  // const pathname = usePathname();
  // const isSplashPage = pathname === '/splash';

  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  return (
    <Provider store={store}>
      <SessionProvider>
        <WagmiProvider
          config={wagmiAdapter.wagmiConfig as Config}
          initialState={initialState}
        >
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <WalletProvider>
                <AuthProvider>
                  <SidebarProvider>
                    <SocketProvider>
                      <div className="flex min-h-screen bg-gradient-to-br from-background to-background/80 w-full">
                        <DashboardSidebar />
                        <div className="flex flex-col flex-1 transition-all duration-300 ease-in-out w-full overflow-x-hidden">
                          <DashboardLayout>{children}</DashboardLayout>
                        </div>
                      </div>
                    </SocketProvider>
                  </SidebarProvider>
                </AuthProvider>
              </WalletProvider>
            </ThemeProvider>
          </QueryProvider>
        </WagmiProvider>
      </SessionProvider>
      <Toaster />
    </Provider>
  );
}
