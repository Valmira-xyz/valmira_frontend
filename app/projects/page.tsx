"use client"

import { PageHeader } from "@/components/layout/page-header"
import { ProjectsList } from "@/components/projects/projects-list"
import { CreateProjectButton } from "@/components/projects/create-project-button"

export default function ProjectsPage() {
  return (
    <div className="space-y-6 w-[calc(100vw-320px)]">
      <PageHeader title="Your Projects">
      </PageHeader>
      <ProjectsList isPublic={false} />
    </div>
  )
}

