"use client"

import { PageHeader } from "@/components/layout/page-header"
import { CreateProjectButton } from "@/components/projects/create-project-button"
import { ProjectsList } from "@/components/projects/projects-list"

export default function PublicProjectsPage() {
    return (
      <div className="space-y-6 w-[calc(100vw-320px)]">
        <PageHeader title="All Projects">
        </PageHeader>
        <ProjectsList isPublic={true} />
      </div>
    )
} 