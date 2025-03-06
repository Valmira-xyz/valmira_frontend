"use client"

import { useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { ProjectsList } from "@/components/projects/projects-list"
import { CreateProjectButton } from "@/components/projects/create-project-button"

// Mock project data
const mockProjects = [
  {
    id: "1",
    name: "TokenX",
    logo: "/placeholder.svg?height=32&width=32",
    blockchain: "Ethereum",
    contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
    status: "Active" as const,
    cumulativeProfit: 15000,
    tradingVolume24h: 50000,
    activeBots: 3,
    profitTrend: [100, 120, 110, 130, 150, 140, 160],
    volumeTrend: [1000, 1200, 1100, 1300, 1500, 1400, 1600],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "2",
    name: "CryptoY",
    logo: "/placeholder.svg?height=32&width=32",
    blockchain: "BSC",
    contractAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    status: "Pending" as const,
    cumulativeProfit: 5000,
    tradingVolume24h: 20000,
    activeBots: 1,
    profitTrend: [50, 60, 55, 65, 75, 70, 80],
    volumeTrend: [500, 600, 550, 650, 750, 700, 800],
    lastUpdated: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState(mockProjects)
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader title="Projects">
        <CreateProjectButton />
      </PageHeader>
      <ProjectsList />
    </div>
  )
}

