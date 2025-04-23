'use client';

import { useSelector } from 'react-redux';

import Link from 'next/link';

import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { LatestProjects } from '@/components/dashboard/latest-projects';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { WalletConnectionCTA } from '@/components/wallet/wallet-connection-cta';
import { RootState } from '@/store/store';

export default function DashboardPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <div className="">
      <section className="p-6 space-y-10">
        {/* {!isAuthenticated && ( */}
          <WalletConnectionCTA
            onConnect={(address) => console.log('Wallet connected:', address)}
          />
        {/* )} */}

        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-2">
            Global Metrics
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Platform-wide performance metrics across all projects
          </p>
          <DashboardMetrics />
        </div>

        {isAuthenticated && <LatestProjects />}

        {!isAuthenticated && (
          <div className="bg-background p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4">
              Explore Public Projects
            </h3>
            <p className="mb-4">
              Browse through our collection of public projects to get a better
              understanding of what Valmira can do for you.
            </p>
            <Button asChild>
              <Link href="/public-projects">View Public Projects</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
