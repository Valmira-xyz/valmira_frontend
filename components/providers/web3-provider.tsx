'use client';

import { ReactNode, useEffect, useState } from 'react';

import { WagmiProvider } from 'wagmi';

// import { wagmiConfig } from '@/lib/web3modal';
import { wagmiAdapter } from '@/lib/walletConfig';

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>{children}</WagmiProvider>
  );
}
