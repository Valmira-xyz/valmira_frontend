'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { fetchProject, fetchProjectStats } from '@/store/slices/projectSlice';

interface ProjectRefreshButtonProps {
  projectId: string;
  onRefresh?: () => Promise<void>;
}

export function ProjectRefreshButton({
  projectId,
}: ProjectRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const dispatch = useDispatch();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false); // Track refresh state in a ref to prevent race conditions

  // Clean up any pending timers when component unmounts
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleRefresh = async () => {
    // Prevent multiple rapid clicks
    if (isRefreshing || isRefreshingRef.current) {
      return;
    }

    // Debounce the refresh action
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsRefreshing(true);
      isRefreshingRef.current = true;

      try {
        // Fetch updated project data
        await dispatch(fetchProject(projectId) as any);

        // Fetch updated project stats
        const end = new Date();
        const start = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
        await dispatch(
          fetchProjectStats({ projectId, timeRange: { start, end } }) as any
        );


        // Show success toast
        toast({
          title: 'Data refreshed',
          description: 'Project data has been updated successfully.',
          duration: 3000,
        });
      } catch (error) {
        console.error('Refresh error:', error);
        toast({
          title: 'Refresh failed',
          description: 'Failed to refresh project data. Please try again.',
          variant: 'destructive',
          duration: 5000,
        });
      } finally {
        setIsRefreshing(false);
        isRefreshingRef.current = false;
      }
    }, 300); // 300ms debounce
  };

  return (
    <Button
      variant="outline"
      onClick={handleRefresh}
      disabled={isRefreshing}
      size="sm"
    >
      <RefreshCw
        className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
      />
      {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
    </Button>
  );
}
