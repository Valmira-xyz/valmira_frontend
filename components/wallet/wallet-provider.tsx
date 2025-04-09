'use client';

import type React from 'react';
import { createContext, useCallback, useContext, useState } from 'react';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const onConnect = useCallback((address: string) => {
    setIsConnected(true);
    setWalletAddress(address);
  }, []);

  const onDisconnect = useCallback(() => {
    setIsConnected(false);
    setWalletAddress('');
  }, []);

  return (
    <WalletContext.Provider
      value={{ isConnected, walletAddress, onConnect, onDisconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
