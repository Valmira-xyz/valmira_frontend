"use client"
import { useParams } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { ProjectHeader } from "@/components/projects/project-header"
import { ProjectMetrics } from "@/components/projects/project-metrics"
import { ProjectAnalytics } from "@/components/projects/project-analytics"
import { ProjectAddOns } from "@/components/projects/project-add-ons"
import { ProjectDangerZone } from "@/components/projects/project-danger-zone"
import { ProjectRefreshButton } from "@/components/projects/project-refresh-button"
import { usePathname } from "next/navigation"
import { useProject } from "@/hooks/use-project"

export default function ProjectDetailPage() {
  const params = useParams()
  const pathname = usePathname()
  const { data: project, isLoading, error } = useProject(params.id)

  if (error) {
    return <div>Error loading project: {error.message}</div>
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={isLoading ? "Loading..." : `Project ${project?.name || params.id}`}>
        <ProjectRefreshButton projectId={params.id as string} />
      </PageHeader>
      <ProjectHeader project={project} walletAddress={project?.walletAddress} />
      <ProjectMetrics project={project} />
      <ProjectAnalytics project={project} />
      <ProjectAddOns project={project} />
      {project && <ProjectDangerZone projectName={project.name} projectId={params.id as string} />}
    </div>
  )
}

