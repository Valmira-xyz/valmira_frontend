'use client';

import { useEffect } from 'react';

import { useAccount } from 'wagmi';

import { WalletConnectionButton } from '@/components/wallet/wallet-connection-button';

import { AuditCard } from '../dashboard/audit-card';
import { StepperCard } from '../dashboard/stepper-card';
import { CreateProjectButton } from '../projects/create-project-button';

const welcomeItems = [
  'No upfront payment',
  '100% transparent fees',
  'Trusted by 1,000+ projects',
];

const auditors = [
  { name: 'logoipsum' },
  { name: 'logoipsum' },
  { name: 'logoipsum' },
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
    <div className="flex flex-col lg:grid lg:grid-cols-[2fr,1fr] gap-4">
      <StepperCard
        steps={[
          {
            stepNumber: '01',
            title: 'Welcome to Valmira.xyz',
            description: 'Decentralized, Automated Market-Making.',
            items: welcomeItems,
            actionElement: isConnected ? (
              <WalletConnectionButton
                buttonText="Switch Wallet"
                variant="secondary"
              />
            ) : (
              // <WalletDisplay variant="header" />
              <WalletConnectionButton variant="secondary" />
            ),
          },
          {
            stepNumber: '02',
            title: 'Start Managing Projects',
            description:
              'Create and manage projects, deploy trading bots, and track performance.',
            actionElement: <CreateProjectButton />,
          },
        ]}
        variant="primary"
        className="w-full"
      />
      <AuditCard auditors={auditors} className="w-full" />
    </div>
  );
}
