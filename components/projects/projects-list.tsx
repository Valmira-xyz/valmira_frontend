"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useDispatch, useSelector } from 'react-redux'
import { fetchProjects, updateProjectStatus, deleteProject } from '@/store/slices/projectSlice'
import type { RootState } from '@/store/store'
import { useRouter } from "next/navigation"

interface ProjectsListProps {
  limit?: number
}

export function ProjectsList({ limit }: ProjectsListProps) {
  const router = useRouter()
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const dispatch = useDispatch()
  const { projects, loading, error } = useSelector((state: RootState) => state.projects)
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

  const handleStatusChange = async (projectId: string, currentStatus: 'active' | 'inactive') => {
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

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    )
  }

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
              <TableCell>{project.status}</TableCell>
              <TableCell>{project.chainName}</TableCell>
              <TableCell className="font-mono">{project.tokenAddress}</TableCell>
              <TableCell>{new Date(project.updatedAt).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => router.push(`/projects/${project._id}`)}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(project._id, project.status)}>
                      Toggle Status
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(project._id)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

