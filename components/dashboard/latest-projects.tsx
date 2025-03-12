"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProjectSummaryCard } from "@/components/projects/project-summary-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProjects } from "@/hooks/use-projects"
import { CreateProjectButton } from "../projects/create-project-button"

export function LatestProjects() {
  const { data: projects, isLoading, error } = useProjects()

  // Show only active projects, sorted by last updated
  const activeProjects = projects
    ?.filter(project => project.status === 'active')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3) // Show only the 3 most recent projects

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Your Latest Active Projects</h2>
        <div className="flex justify-center items-center h-[200px]">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Your Latest Active Projects</h2>
        <div className="text-red-500">Error loading projects</div>
      </div>
    )
  }

  if (!activeProjects?.length) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Your Latest Active Projects</h2>
        <Card>
          <CardHeader>
            <CardTitle>
              {!projects?.length
                ? "Get Started with Your First Project"
                : projects.every(project => project.status !== 'active')
                  ? "All Projects Completed or Inactive"
                  : "No Active Projects Found"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <p className="mb-4 text-muted-foreground">
              {!projects?.length
                ? "Create your first project to start managing your crypto assets and trading bots."
                : projects.every(project => project.status !== 'active')
                  ? "All your projects are either completed or inactive. Create a new project or reactivate an existing one."
                  : "You have projects, but none are currently active. Activate an existing project or create a new one."}
            </p>
            <CreateProjectButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Latest Active Projects</h2>
        <Button asChild variant="outline">
          <Link href="/projects">View All Projects</Link>
        </Button>
      </div>
      <div className="overflow-x-auto pb-4 -mx-6 px-6">
        <div className="flex gap-6 min-w-max">
          {activeProjects.map((project) => (
            <div key={project._id} className="w-[320px] flex-shrink-0">
              <ProjectSummaryCard 
                project={{
                  _id: project._id,
                  name: project.name,
                  chainName: project.chainName,
                  tokenAddress: project.tokenAddress,
                  status: project.status,
                  metrics: project.metrics,
                  pairAddress: project.pairAddress,
                  chainId: project.chainId,
                  owner: project.owner,
                  createdAt: project.createdAt,
                  updatedAt: project.updatedAt,
                  profitTrend: [], // We'll need to implement this later
                  volumeTrend: [], // We'll need to implement this later
                  logo: `/chain-logos/${project.chainId}.png` // Assuming we have chain logos
                }} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

