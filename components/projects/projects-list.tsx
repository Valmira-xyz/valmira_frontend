"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { ProjectSummaryCard } from "@/components/projects/project-summary-card"
import { useToast } from "@/components/ui/use-toast"
import { useDispatch, useSelector } from 'react-redux'
import { fetchProjects, fetchPublicProjects } from '@/store/slices/projectSlice'
import type { RootState } from '@/store/store'
import type { ProjectWithAddons } from '@/types'
import { useRouter } from "next/navigation"
import { Plus, Download, ChevronDown, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DateRange } from "react-day-picker"

interface ProjectsListProps {
  limit?: number
  isPublic?: boolean
  pageSize?: number
}

export function ProjectsList({ limit, isPublic = false, pageSize = 10 }: ProjectsListProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { projects, loading, error } = useSelector((state: RootState) => state.projects as unknown as { projects: ProjectWithAddons[], loading: boolean, error: string | null })
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("All Bots")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2022, 0, 20), // Jan 20, 2022
    to: new Date(2022, 5, 9)     // Jun 09, 2022
  })
  
  const isFirstRender = useRef(true)
  const fetchInProgress = useRef(false)
  const lastFetchParams = useRef({ isPublic, currentPage, pageSize })

  // Debounced fetch function to prevent multiple API calls
  const loadProjects = useCallback(async () => {
    // Skip if a fetch is already in progress or if parameters haven't changed
    if (fetchInProgress.current) return
    
    const paramsChanged = 
      lastFetchParams.current.isPublic !== isPublic || 
      lastFetchParams.current.currentPage !== currentPage ||
      lastFetchParams.current.pageSize !== pageSize
      
    if (!isFirstRender.current && !paramsChanged) return
    
    try {
      fetchInProgress.current = true
      
      // Update last fetch parameters
      lastFetchParams.current = { isPublic, currentPage, pageSize }
      
      if (isPublic) {
        await dispatch(fetchPublicProjects({ pageIndex: currentPage, maxPageCount: pageSize }) as any)
      } else {
        await dispatch(fetchProjects() as any)
      }
      
      isFirstRender.current = false
    } finally {
      fetchInProgress.current = false
    }
  }, [dispatch, isPublic, currentPage, pageSize])

  useEffect(() => {
    // Small delay to prevent rapid consecutive API calls
    const timer = setTimeout(() => {
      loadProjects()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [loadProjects])

  useEffect(() => {
    if (error && !isPublic) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    }
  }, [error, toast, isPublic])

  // Filter projects based on search query and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === "" || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.tokenAddress && project.tokenAddress.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "All Bots" || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const displayedProjects = limit ? filteredProjects.slice(0, limit) : filteredProjects;
  
  const handleCreateNew = () => {
    router.push("/projects/new");
  }

  const handleExport = () => {
    // Export logic here
    toast({
      title: "Export Initiated",
      description: "Your projects data is being exported",
    });
  }
  
  return (
    <div className="space-y-6">
      
      <div className="flex flex-col space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search orders" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[180px]">
                Status: {statusFilter} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter("All Bots")}>All Bots</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Active")}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Paused")}>Paused</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DateRangePicker 
            dateRange={dateRange} 
            onDateRangeChange={setDateRange} 
            className="flex-1 min-w-[240px]"
          />
          
          <Button variant="outline" className="ml-auto" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" /> Create New
          </Button>
        </div>
        
        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProjects.map((project) => (
            <ProjectSummaryCard key={project._id} project={project} />
          ))}
        </div>
        
        {/* Pagination (if needed) */}
        {isPublic && !limit && displayedProjects.length > 0 && (
          <div className="flex justify-center items-center mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="mx-2">Page {currentPage + 1}</span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={displayedProjects.length < pageSize}
            >
              Next
            </Button>
          </div>
        )}
        
        {/* Empty state */}
        {displayedProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No projects found</p>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> Create your first project
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

