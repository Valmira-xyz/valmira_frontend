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
  const projectId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''
  const { data: project, isLoading, error } = useProject(projectId)

  if (error) {
    return <div>Error loading project: {error.message}</div>
  }

  if (isLoading || !project) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={`Project ${project.name}`}>
        <ProjectRefreshButton projectId={projectId} />
      </PageHeader>
      <ProjectHeader project={project} walletAddress={project.walletAddress} />
      <ProjectMetrics project={project} />
      <ProjectAnalytics project={project} />
      <ProjectAddOns project={project} />
      <ProjectDangerZone projectName={project.name} projectId={projectId} />
    </div>
  )
}

