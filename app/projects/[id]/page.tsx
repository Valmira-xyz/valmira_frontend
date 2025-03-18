"use client"
import { useParams } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { ProjectHeader } from "@/components/projects/project-header"
import { ProjectMetrics } from "@/components/projects/project-metrics"
import { ProjectAnalytics } from "@/components/projects/project-analytics"
import { ProjectAddOns } from "@/components/projects/project-add-ons"
import { ProjectDangerZone } from "@/components/projects/project-danger-zone"
import { ProjectRefreshButton } from "@/components/projects/project-refresh-button"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useDispatch, useSelector } from 'react-redux'
import { fetchProject, clearCurrentProject, fetchProjectStats } from '@/store/slices/projectSlice'
import type { RootState } from '@/store/store'
import { Project, ProjectWithAddons, BotPerformance } from "@/types"

// Add helper function to transform bot performance data
const transformBotPerformance = (data: any[]): BotPerformance[] => {
  if (!data) return [];
  return data.map(bot => ({
    botName: bot.botName,
    status: bot.status,
    trades: bot.trades,
    profitContribution: bot.profitContribution,
    uptime: typeof bot.uptime === 'string' ? parseFloat(bot.uptime) : bot.uptime,
    lastUpdated: bot.lastUpdated
  }));
};

export default function ProjectDetailPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const projectId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''
  const { projects, loading: isLoading, error, projectStats } = useSelector((state: RootState) => state.projects)
  const project = projects.find((project) => project._id?.toString() === projectId)

  // Combined authentication check and data fetching
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view project details.",
        variant: "destructive"
      })
      router.push('/login')
      return
    }

    setIsAuthenticated(true)
    if (projectId) {
      dispatch(fetchProject(projectId) as any)
      // Fetch project stats for the last 24 hours
      const end = new Date()
      const start = new Date(Date.now() - 24 * 60 * 60 * 1000)
      dispatch(fetchProjectStats({ projectId, timeRange: { start, end } }) as any)
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentProject())
    }
  }, [projectId, dispatch, router, toast])

  if (error) {
    console.error('Error loading project:', error)
    const errorMessage = typeof error === 'string' && error.includes('401')
      ? "Authentication expired. Please log in again."
      : error
    
    if (typeof error === 'string' && error.includes('401')) {
      localStorage.removeItem('token')
      router.push('/login')
    }

    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      </div>
    )
  }

  // Safely cast project to ProjectWithAddons or use default values
  const projectWithAddons = project as unknown as ProjectWithAddons | undefined

  const metricsProject = projectStats?.metrics || {
    cumulativeProfit: projectWithAddons?.metrics?.cumulativeProfit || 0,
    volume24h: projectWithAddons?.metrics?.volume24h || 0,
    activeBots: projectWithAddons?.metrics?.activeBots || 0,
    liquidity: 0,
    lastUpdate: new Date()
  }

  const handleRefresh = async () => {
    if (projectId) {
      await dispatch(fetchProject(projectId) as any)
      const end = new Date()
      const start = new Date(Date.now() - 24 * 60 * 60 * 1000)
      await dispatch(fetchProjectStats({ projectId, timeRange: { start, end } }) as any)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={`Project ${project?.name}`}>
        <ProjectRefreshButton 
          projectId={projectId} 
          onRefresh={handleRefresh}
        />
      </PageHeader>
      <ProjectHeader 
        project={projectWithAddons} 
        walletAddress={projectWithAddons?.tokenAddress} 
      />
      {projectWithAddons && <ProjectMetrics project={projectWithAddons} /> }
      <ProjectAnalytics 
        project={project}
        trends={projectStats?.trends}
        botPerformance={projectStats?.botPerformance ? transformBotPerformance(projectStats.botPerformance) : undefined}
        recentActivity={projectStats?.recentActivity}
      />
      <ProjectAddOns project={projectWithAddons} />
      {projectWithAddons && <ProjectDangerZone project={projectWithAddons} />}     
    </div>
  )
}

