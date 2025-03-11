'use client';

import { ThemeProvider } from 'next-themes';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store/store';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from '@/lib/wagmi';

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