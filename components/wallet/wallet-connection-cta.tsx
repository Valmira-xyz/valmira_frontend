'use client';

import { useEffect } from 'react';

import { WalletDisplay } from './wallet-display';
import { useAccount } from 'wagmi';

import { WalletConnectionButton } from '@/components/wallet/wallet-connection-button';

import { StepperCard } from '../stepper/stepper-card';

const welcomeItems = [
  'No upfront payment',
  '100% transparent fees',
  'Trusted by 1,000+ projects',
];

export function WalletConnectionCTA({
  onConnect,
}: {
  onConnect: (address: string) => void;
}) {
  const { isConnected } = useAccount();

  useEffect(() => {
    const handleWalletConnected = (event: Event) => {
      const customEvent = event as CustomEvent<{ address: string }>;
      onConnect(customEvent.detail.address);
    };

    window.addEventListener('walletConnected', handleWalletConnected);
    return () => {
      window.removeEventListener('walletConnected', handleWalletConnected);
    };
  }, [onConnect]);

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-4">
      <StepperCard
        stepNumber="01"
        title="Welcome to Valmira.xyz"
        description="Decentralized, Automated Market-Making."
        items={welcomeItems}
        actionElement={
          isConnected ? (
            <WalletDisplay variant="header" />
          ) : (
            <WalletConnectionButton className="" variant="secondary" />
          )
        }
        variant="primary"
      />

      <StepperCard
        stepNumber="02"
        title="Start Managing Projects"
        description="Create and manage projects, deploy trading bots, and track performance."
        actionElement={<></>}
        variant="muted"
      />
    </div>
  );
}
