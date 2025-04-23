'use client';

import { PageHeader } from '@/components/layout/page-header';
import { ProjectsList } from '@/components/projects/projects-list';

export default function PublicProjectsPage() {
  return (
    <div className="w-full">
      <ProjectsList isPublic={true} />
    </div>
  );
}
