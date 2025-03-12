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
import { fetchProject, clearCurrentProject } from '@/store/slices/projectSlice'
import type { RootState } from '@/store/store'

export default function ProjectDetailPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const projectId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''
  const { currentProject: project, loading: isLoading, error } = useSelector((state: RootState) => state.projects)

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    console.log('Checking authentication token:', token ? 'Present' : 'Missing')
    setIsAuthenticated(!!token)
    
    if (!token) {
      console.log('No authentication token found, redirecting to login')
      toast({
        title: "Authentication Required",
        description: "Please log in to view project details.",
        variant: "destructive"
      })
      router.push('/login')
    }
  }, [router, toast])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearCurrentProject())
    }
  }, [dispatch])

  useEffect(() => {
    console.log('Project ID:', projectId)
    console.log('Project Data:', project)
    console.log('Loading State:', isLoading)
    console.log('Error State:', error)
    console.log('Authentication State:', isAuthenticated)
  }, [projectId, project, isLoading, error, isAuthenticated])

  // Fetch project data when component mounts and is authenticated
  useEffect(() => {
    if (projectId && isAuthenticated) {
      console.log('Fetching project data...')
      dispatch(fetchProject(projectId) as any)
    }
  }, [projectId, isAuthenticated, dispatch])

  if (!isAuthenticated) {
    console.log('Not authenticated, showing loading state')
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

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

  if (isLoading || !project) {
    console.log('Loading project data...')
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Transform project data to match component prop types
  const headerProject = {
    name: project.name,
    blockchain: project.chainName,
    contractAddress: project.tokenAddress,
    status: project.status === 'active' ? 'Active' as const : 'Paused' as const,
    lastUpdated: project.updatedAt
  }

  const metricsProject = {
    cumulativeProfit: project.metrics.cumulativeProfit,
    tradingVolume24h: project.metrics.volume24h,
    activeBots: project.metrics.activeBots,
    liquidity: 0 // This field doesn't exist in our Project type, defaulting to 0
  }

  console.log('Rendering project view with data:', {
    headerProject,
    metricsProject,
    owner: project.owner
  })

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={`Project ${project.name}`}>
        <ProjectRefreshButton 
          projectId={projectId} 
          onRefresh={() => {
            console.log('Manual refresh triggered')
            dispatch(fetchProject(projectId) as any)
          }} 
        />
      </PageHeader>
      <ProjectHeader project={headerProject} walletAddress={project.owner} />
      <ProjectMetrics project={metricsProject} />
      <ProjectAnalytics project={project} />
      <ProjectAddOns project={project} />
      <ProjectDangerZone projectName={project.name} projectId={projectId} />
    </div>
  )
}

