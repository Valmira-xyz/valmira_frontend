"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useDispatch } from "react-redux"
import { fetchProject, fetchProjectStats } from "@/store/slices/projectSlice"

interface ProjectRefreshButtonProps {
  projectId: string
  onRefresh?: () => void
}

export function ProjectRefreshButton({ projectId, onRefresh }: ProjectRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const dispatch = useDispatch()

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      // Fetch updated project data
      await dispatch(fetchProject(projectId) as any)

      // Fetch updated project stats
      const end = new Date()
      const start = new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      await dispatch(fetchProjectStats({ projectId, timeRange: { start, end } }) as any)

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
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh project data. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} size="sm">
      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing ? "Refreshing..." : "Refresh Data"}
    </Button>
  )
}

