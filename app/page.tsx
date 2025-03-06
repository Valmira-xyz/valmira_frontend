"use client"

import { PageHeader } from "@/components/layout/page-header"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { LatestProjects } from "@/components/dashboard/latest-projects"
import { CreateProjectButton } from "@/components/projects/create-project-button"
import { WalletConnectionCTA } from "@/components/wallet/wallet-connection-cta"

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <PageHeader title="Dashboard">
        <CreateProjectButton />
      </PageHeader>
      <WalletConnectionCTA onConnect={(address) => console.log("Wallet connected:", address)} />

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Global Metrics</h2>
        <p className="text-muted-foreground mb-6">Platform-wide performance metrics across all projects</p>
        <DashboardMetrics />
      </div>

      <LatestProjects />
    </div>
  )
}

