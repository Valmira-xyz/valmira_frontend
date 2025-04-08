"use client"

import { PageHeader } from "@/components/layout/page-header"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { LatestProjects } from "@/components/dashboard/latest-projects"
import { CreateProjectButton } from "@/components/projects/create-project-button"
import { WalletConnectionCTA } from "@/components/wallet/wallet-connection-cta"
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  return (
    <div className="space-y-10 w-full">
      <PageHeader title="Dashboard">
        {isAuthenticated && (
          <CreateProjectButton />
        )}
      </PageHeader>
      
      {!isAuthenticated && (
        <div className="bg-muted p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Welcome to Valmira Platform</h3>
          <p className="mb-4">
            Valmira is a powerful platform for managing crypto projects and trading bots. 
            Connect your wallet to create projects and access all features.
          </p>
          <WalletConnectionCTA onConnect={(address) => console.log("Wallet connected:", address)} />
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Global Metrics</h2>
        <p className="text-muted-foreground mb-6">Platform-wide performance metrics across all projects</p>
        <DashboardMetrics />
      </div>

      {isAuthenticated && <LatestProjects />}
      
      {!isAuthenticated && (
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-4">Explore Public Projects</h3>
          <p className="mb-4">
            Browse through our collection of public projects to get a better understanding of what
            Valmira can do for you.
          </p>
          <Button asChild>
            <Link href="/public-projects">View Public Projects</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

