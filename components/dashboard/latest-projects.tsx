'use client';

import { useCallback, useEffect, useRef } from 'react';

import Link from 'next/link';

import { ProjectSummaryCard } from '@/components/projects/project-summary-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDispatch, useSelector } from '@/hooks/use-redux';
import { fetchProjects } from '@/store/slices/projectSlice';
import type { Project, ProjectWithAddons } from '@/types';

import { CreateProjectButton } from '../projects/create-project-button';

export function LatestProjects() {
  const dispatch = useDispatch();
  const { projects, error } = useSelector((state) => state.projects);
  const fetchInProgress = useRef(false);
  const hasInitialFetch = useRef(false);

  const fetchProjectsData = useCallback(async () => {
    // Skip if fetch is already in progress or if we've already fetched
    if (fetchInProgress.current || (hasInitialFetch.current && !error)) return;

    try {
      fetchInProgress.current = true;
      await dispatch(fetchProjects());
      hasInitialFetch.current = true;
    } finally {
      fetchInProgress.current = false;
    }
  }, [dispatch, error]);

  useEffect(() => {
    fetchProjectsData();
  }, [fetchProjectsData]);

  // Show only active projects, sorted by last updated
  const activeProjects = projects
    ?.filter((project: ProjectWithAddons) => project.status === 'active')
    .sort(
      (a: ProjectWithAddons, b: ProjectWithAddons) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 3); // Show only the 3 most recent projects

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Your Latest Active Projects</h2>
        <div className="text-red-500">Please check connect your wallet.</div>
      </div>
    );
  }

  if (!activeProjects?.length) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Your Latest Active Projects</h2>
        <Card>
          <CardHeader>
            <CardTitle>
              {!projects?.length
                ? 'Get Started with Your First Project'
                : projects.every(
                      (project: Project) => project.status !== 'active'
                    )
                  ? 'All Projects Completed or Inactive'
                  : 'No Active Projects Found'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center p-4">
            <p className="mb-4 text-muted-foreground">
              {!projects?.length
                ? 'Create your first project to start managing your crypto assets and trading bots.'
                : projects.every(
                      (project: Project) => project.status !== 'active'
                    )
                  ? 'All your projects are either completed or inactive. Create a new project or reactivate an existing one.'
                  : 'You have projects, but none are currently active. Activate an existing project or create a new one.'}
            </p>
            <CreateProjectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-start md:justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Your Latest Active Projects</h2>
        <Button asChild variant="outline">
          <Link href="/public-projects">View All Projects</Link>
        </Button>
      </div>
      <div className="pb-4 -mx-6 px-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map((project: ProjectWithAddons) => (
            <div key={project._id} className="flex-shrink-0">
              <ProjectSummaryCard project={project} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
