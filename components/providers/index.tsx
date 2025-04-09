'use client';

import { Provider as ReduxProvider } from 'react-redux';

import { ThemeProvider } from 'next-themes';
import { WagmiConfig } from 'wagmi';

import { wagmiConfig } from '@/lib/wagmi';
import { store } from '@/store/store';

interface ProvidersProps {
  children: React.ReactNode;
  cookies: string | null;
}

export function Providers({ children, cookies }: ProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <WagmiConfig config={wagmiConfig}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </WagmiConfig>
    </ReduxProvider>
  );
}
