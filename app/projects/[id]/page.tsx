'use client';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useParams } from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';

import { ProjectAddOns } from '@/components/projects/project-add-ons';
import {
  ProjectAnalytics,
  ProjectAnalyticsHandle,
} from '@/components/projects/project-analytics';
import { ProjectDangerZone } from '@/components/projects/project-danger-zone';
import { ProjectHeader } from '@/components/projects/project-header';
import { ProjectMetrics } from '@/components/projects/project-metrics';
import { useToast } from '@/components/ui/use-toast';
import {
  clearCurrentProject,
  fetchProject,
  fetchProjectStats,
} from '@/store/slices/projectSlice';
import type { RootState } from '@/store/store';
import { BotPerformance, ProjectWithAddons } from '@/types';
import { motion } from 'framer-motion';

// Add helper function to transform bot performance data
const transformBotPerformance = (data: any[]): BotPerformance[] => {
  if (!data) return [];
  return data.map((bot) => ({
    botName: bot.botName,
    status: bot.status,
    trades: bot.trades,
    profitContribution: bot.profitContribution,
    uptime:
      typeof bot.uptime === 'string' ? parseFloat(bot.uptime) : bot.uptime,
    lastUpdated: bot.lastUpdated,
  }));
};

export default function ProjectDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const projectId =
    typeof params.id === 'string'
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : '';
  const {
    projects,
    loading: isLoading,
    error,
    projectStats,
    bnbPrice,
    bnbPriceLoading,
  } = useSelector((state: RootState) => state.projects);
  const project = projects.find(
    (project) => project._id?.toString() === projectId
  );

  // Add a ref to access the ProjectAnalytics methods
  const analyticsRef = useRef<ProjectAnalyticsHandle>(null);
  const fetchingProjectRef = useRef(false);

  // Combined authentication check and data fetching
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    setIsAuthenticated(true);
    if (projectId) {
      // Fetch project stats for the last 24 hours
      if(fetchingProjectRef.current) {
        return;
      }
      fetchingProjectRef.current = true;
      const end = new Date();
      const start = new Date(Date.now() - 24 * 60 * 60 * 1000);
      dispatch(
        fetchProjectStats({ projectId, timeRange: { start, end } }) as any
      );
      setTimeout(() => {
        dispatch(fetchProject(projectId) as any);
      }, 2000);
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentProject());
    };
  }, [projectId, dispatch, router, toast]);

  if (error) {
    console.error('Error loading project:', error);
    const errorMessage =
      typeof error === 'string' && error.includes('401')
        ? 'Authentication expired. Please log in again.'
        : error;

    if (typeof error === 'string' && error.includes('401')) {
      localStorage.removeItem('token');
      router.push('/login');
    }

    return (
      <div className="p-6">
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      </div>
    );
  }

  // Safely cast project to ProjectWithAddons or use default values
  const projectWithAddons = project as unknown as ProjectWithAddons | undefined;

  return (
    <motion.div
      className="overflow-x-hidden w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <ProjectHeader
          project={projectWithAddons}
          walletAddress={projectWithAddons?.tokenAddress}
          projectId={projectId}
        />
        {projectWithAddons && (
          <ProjectMetrics
            project={projectWithAddons}
            projectStats={projectStats}
            loading={isLoading}
            bnbPrice={bnbPrice}
            bnbPriceLoading={bnbPriceLoading}
          />
        )}
        <ProjectAnalytics project={project} ref={analyticsRef} projectStats={projectStats} />
        <ProjectAddOns project={projectWithAddons} />
        {projectWithAddons && <ProjectDangerZone project={projectWithAddons} />}
      </div>
    </motion.div>
  );
}
