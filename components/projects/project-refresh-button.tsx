"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ProjectRefreshButtonProps {
  projectId: string
  onRefresh?: () => void
}

export function ProjectRefreshButton({ projectId, onRefresh }: ProjectRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const handleRefresh = () => {
    setIsRefreshing(true)

    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false)

      // Call the onRefresh callback if provided
      if (onRefresh) {
        onRefresh()
      }

      // Show success toast
      toast({
        title: "Data refreshed",
        description: "Project data has been updated successfully.",
        duration: 3000,
      })
    }, 1500)
  }

  return (
    <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} size="sm">
      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing ? "Refreshing..." : "Refresh Data"}
    </Button>
  )
}

