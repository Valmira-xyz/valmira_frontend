'use client';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

import {
  ProjectAnalytics,
  ProjectAnalyticsHandle,
} from '@/components/projects/project-analytics';
import { ProjectHeader } from '@/components/projects/project-header';
import { ProjectMetrics } from '@/components/projects/project-metrics';
import { PackBots } from '@/components/strategy-packs/pack-bots';
import { PackDangerZone } from '@/components/strategy-packs/pack-danger-zone';
import { useToast } from '@/components/ui/use-toast';
import {
  clearCurrentPack,
  clearCurrentProject,
  fetchPackById,
  fetchProjectStats,
  updateCurrentProject,
} from '@/store/slices/projectSlice';
import type { RootState } from '@/store/store';
import { Project, ProjectWithAddons } from '@/types';

// Add helper function to transform bot performance data
// const transformBotPerformance = (data: any[]): BotPerformance[] => {
//   if (!data) return [];
//   return data.map((bot) => ({
//     botName: bot.botName,
//     status: bot.status,
//     trades: bot.trades,
//     profitContribution: bot.profitContribution,
//     uptime:
//       typeof bot.uptime === 'string' ? parseFloat(bot.uptime) : bot.uptime,
//     lastUpdated: bot.lastUpdated,
//   }));
// };

export default function PackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const projectId = params?.id
    ? typeof params.id === 'string'
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : ''
    : '';
  const {
    packs,
    currentPack,
    loading: isLoading,
    error,
  } = useSelector((state: RootState) => state.projects);

  // Use currentPack if available, otherwise find in packs array
  const project =
    currentPack || packs.find((pack) => pack._id?.toString() === projectId);

  // Update currentProject in Redux store when pack is loaded
  useEffect(() => {
    if (project) {
      // Cast pack to ProjectWithAddons and update currentProject in store
      dispatch(updateCurrentProject(project as unknown as Project));
    }
  }, [project, dispatch]);

  // Add a ref to access the ProjectAnalytics methods
  const analyticsRef = useRef<ProjectAnalyticsHandle>(null);
  const fetchingPackRef = useRef(false);

  // Extract pack data fetching logic into a reusable function
  const fetchPackData = async () => {
    if (!projectId) return;

    try {
      fetchingPackRef.current = true;
      const end = new Date();
      const start = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Fetch pack data first
      await dispatch(fetchPackById(projectId) as any);

      // Then fetch pack stats
      await dispatch(
        fetchProjectStats({ projectId, timeRange: { start, end } }) as any
      );
    } catch (error) {
      console.error('Error fetching pack data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pack data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      fetchingPackRef.current = false;
    }
  };

  // Combined authentication check and data fetching
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    if (projectId) {
      fetchPackData();
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentPack());
      dispatch(clearCurrentProject());
    };
  }, [projectId, dispatch, router, toast]);

  if (error) {
    console.error('Error loading pack:', error);
    const errorMessage =
      typeof error === 'string' && error.includes('401')
        ? 'Authentication expired. Please log in again.'
        : error;

    if (typeof error === 'string' && error.includes('401')) {
      localStorage.removeItem('token');
      router.push('/');
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

  // Safely cast pack to ProjectWithAddons (using same interface for compatibility)
  const projectWithAddons = project as unknown as ProjectWithAddons;

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
          onProjectUpdate={fetchPackData}
        />
        <ProjectMetrics project={projectWithAddons} loading={isLoading} />
        <ProjectAnalytics ref={analyticsRef} />
        <PackBots project={projectWithAddons} />
        <PackDangerZone project={projectWithAddons} />
      </div>
    </motion.div>
  );
}
