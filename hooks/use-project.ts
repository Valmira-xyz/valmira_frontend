import { useQuery } from "@tanstack/react-query"
import type { Project } from "@/types"

const fetchProject = async (id: string): Promise<Project | null> => {
  // Simulate fetching a single project from an API or database
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
  // Replace with actual API call or database query
  const mockProjects = [
    {
      id: "1",
      name: "TokenX",
      logo: "/placeholder.svg?height=32&width=32",
      blockchain: "Ethereum",
      contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
      status: "Active",
      cumulativeProfit: 12345,
      tradingVolume24h: 1200000,
      activeBots: 3,
      profitTrend: [100, 110, 120, 115, 125, 130, 135],
      volumeTrend: [1000000, 1100000, 1050000, 1200000, 1150000, 1250000, 1200000],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "2",
      name: "CryptoY",
      logo: "/placeholder.svg?height=32&width=32",
      blockchain: "BSC",
      contractAddress: "0x9876543210fedcba9876543210fedcba98765432",
      status: "Active",
      cumulativeProfit: 8765,
      tradingVolume24h: 987000,
      activeBots: 2,
      profitTrend: [80, 85, 90, 88, 92, 95, 98],
      volumeTrend: [900000, 950000, 980000, 970000, 990000, 1000000, 987000],
      lastUpdated: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    },
  ]
  return mockProjects.find((project) => project.id === id) || null
}

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
  })
}

