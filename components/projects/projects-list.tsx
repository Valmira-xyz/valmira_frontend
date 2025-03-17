"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useDispatch, useSelector } from 'react-redux'
import { fetchProjects, updateProjectStatus, deleteProject } from '@/store/slices/projectSlice'
import type { RootState } from '@/store/store'
import type { ProjectWithAddons } from '@/types'
import { useRouter } from "next/navigation"
import { getBadgeVariant } from "@/lib/utils"
import Link from "next/link"

interface ProjectsListProps {
  limit?: number
}

export function ProjectsList({ limit }: ProjectsListProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { projects, loading, error } = useSelector((state: RootState) => state.projects as unknown as { projects: ProjectWithAddons[], loading: boolean, error: string | null })
  const { toast } = useToast()

  useEffect(() => {
    console.log('Fetching projects...')
    dispatch(fetchProjects() as any)
  }, [dispatch])

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    }
  }, [error, toast])


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
    </div>
  )
}

