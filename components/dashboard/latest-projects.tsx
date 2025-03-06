"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProjectSummaryCard } from "@/components/projects/project-summary-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProjects } from "@/hooks/use-projects"

export function LatestProjects() {
  const { data: projects, isLoading, error } = useProjects()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Latest Active Projects</h2>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-[200px]">Loading...</div>
      ) : error ? (
        <div className="text-red-500">Error loading projects</div>
      ) : (projects ?? []).length > 0 ? (
        <div className="overflow-x-auto pb-4 -mx-6 px-6">
          <div className="flex gap-6 min-w-max">
            {(projects ?? []).map((project) => (
              <div key={project.id} className="w-[320px] flex-shrink-0">
                <ProjectSummaryCard 
                  project={{
                    ...project,
                    logo: project.logo ?? '/default-project-logo.png',
                    profitTrend: project.profitTrend ?? [],
                    volumeTrend: project.volumeTrend ?? []
                  }} 
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Get Started with Your First Project</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <p className="mb-4 text-muted-foreground">
              Create your first project to start managing your crypto assets and trading bots.
            </p>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" /> Create New Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

