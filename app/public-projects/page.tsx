'use client';

import { PageHeader } from '@/components/layout/page-header';
import { ProjectsList } from '@/components/projects/projects-list';

export default function PublicProjectsPage() {
  return (
    <div className="w-full">
      <PageHeader title="All Projects"></PageHeader>
      <ProjectsList isPublic={true} />
    </div>
  );
}
