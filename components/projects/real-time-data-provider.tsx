"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"

// Define the shape of our project data
interface ProjectData {
  id: string
  name: string
  tradingVolume24h: number
  cumulativeProfit: number
  activeBots: number
  lastUpdated: string
  // Add other project properties as needed
}

// Define the context shape
interface RealTimeDataContextType {
  projectData: ProjectData | null
  isLoading: boolean
  error: Error | null
  refreshData: () => void
}

// Create the context
const RealTimeDataContext = createContext<RealTimeDataContextType>({
  projectData: null,
  isLoading: false,
  error: null,
  refreshData: () => {},
})

// Hook to use the context
export const useRealTimeData = () => useContext(RealTimeDataContext)

interface RealTimeDataProviderProps {
  children: ReactNode
  projectId: string
  initialData?: ProjectData
  refreshInterval?: number // in milliseconds
}

export function RealTimeDataProvider({
  children,
  projectId,
  initialData,
  refreshInterval = 30000, // Default to 30 seconds
}: RealTimeDataProviderProps) {
  const [projectData, setProjectData] = useState<ProjectData | null>(initialData || null)
  const [isLoading, setIsLoading] = useState<boolean>(!initialData)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  // Function to fetch the latest data
  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // In a real app, this would be an API call
      // For demo purposes, we'll simulate a fetch with random data updates
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (!projectData && !initialData) {
        throw new Error("Failed to load project data")
      }

      const baseData = projectData || initialData
      if (!baseData) return

      // Generate updated data with small random changes
      const updatedData: ProjectData = {
        ...baseData,
        tradingVolume24h: baseData.tradingVolume24h * (1 + (Math.random() * 0.1 - 0.05)), // ±5% change
        cumulativeProfit: baseData.cumulativeProfit * (1 + Math.random() * 0.02), // 0-2% increase
        activeBots: Math.max(1, baseData.activeBots + (Math.random() > 0.7 ? 1 : 0) - (Math.random() > 0.8 ? 1 : 0)),
        lastUpdated: new Date().toISOString(),
      }

      setProjectData(updatedData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      toast({
        title: "Error refreshing data",
        description: "Failed to update project data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (!initialData) {
      fetchData()
    }
  }, [initialData])

  // Set up periodic refresh
  useEffect(() => {
    const intervalId = setInterval(fetchData, refreshInterval)

    // Clean up on unmount
    return () => clearInterval(intervalId)
  }, [refreshInterval])

  // Function to manually refresh data
  const refreshData = () => {
    fetchData()
  }

  return (
    <RealTimeDataContext.Provider value={{ projectData, isLoading, error, refreshData }}>
      {children}
    </RealTimeDataContext.Provider>
  )
}

