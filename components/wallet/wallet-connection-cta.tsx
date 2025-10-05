'use client';

import { useEffect } from 'react';

import { useAccount } from 'wagmi';

import { WalletConnectionButton } from '@/components/wallet/wallet-connection-button';

import { AuditCard } from '../dashboard/audit-card';
import { StepperCard } from '../dashboard/stepper-card';
// import { cn } from '@/lib/utils';
// import { Button } from '../ui/button';
// import { User } from 'lucide-react';
import { UseCaseCard } from '../dashboard/usecase-card';
import { CreateProjectButton } from '../projects/create-project-button';

const welcomeItems = [
  'No Upfront Payment',
  '100% Transparent Fees',
  'Trusted by 1,000+ Projects',
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
    <div
      className="grid gap-4
    grid-cols-1
    md:grid-cols-2
    lg:grid-cols-4
    items-stretch"
    >
      <div className="col-span-1 md:col-span-2 lg:col-span-2 h-full">
        <StepperCard
          steps={[
            {
              stepNumber: '1',
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
              stepNumber: '2',
              title: 'Start Managing Projects',
              description:
                'Create and manage projects, deploy trading bots, and track performance.',
              actionElement: <CreateProjectButton />,
            },
          ]}
          variant="primary"
          className="h-full"
        />
      </div>
      <div className="col-span-1 lg:col-span-1 h-full">
        <AuditCard className="h-full" />
      </div>
      <div className="col-span-1 lg:col-span-1 h-full">
        <UseCaseCard projects={auditors} className="h-full" />
      </div>
    </div>

    // <div className="flex flex-col lg:grid md:grid md:grid-cols-[2fr,1fr,1fr] lg:grid-cols-[2fr,1fr,1fr] gap-4">
    //   <StepperCard
    //     steps={[
    //       {
    //         stepNumber: '1',
    //         title: 'Welcome to Valmira.xyz',
    //         description: 'Decentralized, Automated Market-Making.',
    //         items: welcomeItems,
    //         actionElement: isConnected ? (
    //           <WalletConnectionButton
    //             buttonText="Switch Wallet"
    //             variant="secondary"
    //           />
    //         ) : (
    //           // <WalletDisplay variant="header" />
    //           <WalletConnectionButton variant="secondary" />
    //         ),
    //       },
    //       {
    //         stepNumber: '2',
    //         title: 'Start Managing Projects',
    //         description:
    //           'Create and manage projects, deploy trading bots, and track performance.',
    //         actionElement: <CreateProjectButton />,
    //       },
    //     ]}
    //     variant="primary"
    //     className="w-full"
    //   />
    //   <AuditCard auditors={auditors} className="!w-fit" />
    //   <UseCaseCard projects={auditors} className="!w-fit" />
    // </div>
  );
}
