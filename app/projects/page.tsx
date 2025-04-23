'use client';

import { PageHeader } from '@/components/layout/page-header';
import { ProjectsList } from '@/components/projects/projects-list';

export default function ProjectsPage() {
  return (
    <div className="space-y-6 w-[calc(100vw-320px)]">
      <ProjectsList isPublic={false} />
    </div>
  );
}
