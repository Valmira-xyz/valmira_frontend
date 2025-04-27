'use client';

import { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { bsc, bscTestnet } from 'viem/chains';
import { type Config, cookieToInitialState, WagmiProvider } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';

import { AuthProvider } from '@/components/AuthProvider';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { QueryProvider } from '@/components/query-provider';
import { SessionProvider } from '@/components/session-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { WalletProvider } from '@/components/wallet/wallet-provider';
import { projectId, wagmiAdapter } from '@/lib/web3modal';
import { store } from '@/store/store';

if (!projectId) {
  throw new Error('Project ID is not defined');
}

// Set up metadata
const metadata = {
  name: 'valmira_frontend',
  description: 'The first innovated multi chain meme launchpad',
  url: 'https://reown.com/appkit', // origin must match your domain & subdomain
  icons: ['https://assets.reown.com/reown-profile-pic.png'],
};

// Create the modal
export const web3modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [bsc, bscTestnet],
  defaultNetwork: bsc,
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
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  // Check if this is the splash page using URL
  const isClientSide = typeof window !== 'undefined';
  const isSplashPage = isClientSide
    ? window.location.pathname === '/splash'
    : false;

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
                    <div className="flex min-h-screen bg-gradient-to-br from-background to-background/80 w-full">
                      {!isSplashPage && <DashboardSidebar />}
                      <div className="flex flex-col flex-1 transition-all duration-300 ease-in-out w-full overflow-x-hidden">
                        <main className="">{children}</main>
                      </div>
                    </div>
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
