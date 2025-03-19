"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useDispatch, useSelector } from 'react-redux'
import { fetchProjects, fetchPublicProjects, updateProjectStatus, deleteProject } from '@/store/slices/projectSlice'
import type { RootState } from '@/store/store'
import type { ProjectWithAddons } from '@/types'
import { useRouter } from "next/navigation"
import { getBadgeVariant } from "@/lib/utils"
import Link from "next/link"

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
  const isFirstRender = useRef(true)
  const fetchInProgress = useRef(false)
  const lastFetchParams = useRef({ isPublic, currentPage, pageSize })

  // Debounced fetch function to prevent multiple API calls
  const fetchProjects = useCallback(async () => {
    // Skip if a fetch is already in progress or if parameters haven't changed
    if (fetchInProgress.current) return
    
    const paramsChanged = 
      lastFetchParams.current.isPublic !== isPublic || 
      lastFetchParams.current.currentPage !== currentPage ||
      lastFetchParams.current.pageSize !== pageSize
      
    if (!isFirstRender.current && !paramsChanged) return
    
    try {
      fetchInProgress.current = true
      console.log('Fetching projects...')
      
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
      fetchProjects()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [fetchProjects])

  useEffect(() => {
    if (error && !isPublic) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    }
  }, [error, toast, isPublic])


  const handleStatusChange = async (projectId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      console.log(`Updating project ${projectId} status from ${currentStatus} to ${newStatus}`)
      await dispatch(updateProjectStatus({ projectId, status: newStatus }) as any)
      console.log('Project status updated in Redux store')
      toast({
        title: "Status Updated",
        description: "Project status has been updated successfully."
      })
    } catch (error) {
      console.error('Error updating project status:', error)
      toast({
        title: "Error",
        description: "Failed to update project status.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (projectId: string) => {
    try {
      await dispatch(deleteProject(projectId) as any)
      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive"
      })
    }
  }

  // if (loading) {
  //   return (
  //     <div className="animate-pulse space-y-4">
  //       <div className="h-10 bg-gray-200 rounded"></div>
  //       <div className="h-40 bg-gray-200 rounded"></div>
  //     </div>
  //   )
  // }

  const displayedProjects = limit ? projects.slice(0, limit) : projects
  
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Chain</TableHead>
            <TableHead>Contract</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedProjects.map((project) => (
            <TableRow key={project._id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>
                
              <Badge variant={getBadgeVariant(project.status)} className="font-medium text-sm px-3 py-1 rounded-full">
                        {project.status}
                      </Badge>
              </TableCell>
              <TableCell>{project.chainName || "BSC"}</TableCell>
              <TableCell className="font-mono">{project.tokenAddress}</TableCell>
              <TableCell>{new Date(project.updatedAt).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                    <div className="cursor-pointer" onClick={() => router.push(`/projects/${project._id}`)}>
                      View Details
                    </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {isPublic && !limit && (
        <div className="flex justify-center items-center mt-4 gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className={`px-3 py-1 rounded ${currentPage === 0 ? 'bg-gray-200 text-gray-500' : 'bg-primary text-white'}`}
          >
            Previous
          </button>
          <span className="mx-2">Page {currentPage + 1}</span>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={displayedProjects.length < pageSize}
            className={`px-3 py-1 rounded ${displayedProjects.length < pageSize ? 'bg-gray-200 text-gray-500' : 'bg-primary text-white'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

