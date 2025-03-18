"use client"

import { PageHeader } from "@/components/layout/page-header"
import { ProjectsList } from "@/components/projects/projects-list"

export default function PublicProjectsPage() {
  return (
    <div className="space-y-6 w-[calc(100vw-320px)]">
      <PageHeader title="Public Projects" />
      <ProjectsList isPublic={true} pageSize={15} />
    </div>
  )
} 