"use client"

import { useState } from "react"
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
import { ProjectDialog } from "@/components/projects/project-dialog"

// Mock project data
const initialProjects = [
  {
    id: "1",
    name: "TokenX",
    contractAddress: "0x1234...5678",
    network: "Ethereum",
    launchDate: "2023-05-15",
    status: "Active",
  },
  {
    id: "2",
    name: "CryptoY",
    contractAddress: "0x9876...5432",
    network: "BSC",
    launchDate: "2023-06-01",
    status: "Pending",
  },
]

interface ProjectsListProps {
  limit?: number
}

export function ProjectsList({ limit }: ProjectsListProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [selectedProject, setSelectedProject] = useState<(typeof initialProjects)[0] | null>(null)

  const displayedProjects = limit ? projects.slice(0, limit) : projects

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((project) => project.id !== id))
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contract Address</TableHead>
            <TableHead>Network</TableHead>
            <TableHead>Launch Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedProjects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>{project.contractAddress}</TableCell>
              <TableCell>{project.network}</TableCell>
              <TableCell>{project.launchDate}</TableCell>
              <TableCell>{project.status}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setSelectedProject(project)}>View details</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDeleteProject(project.id)}>
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedProject && (
        <ProjectDialog
          project={selectedProject}
          open={!!selectedProject}
          onOpenChange={() => setSelectedProject(null)}
        />
      )}
    </>
  )
}

