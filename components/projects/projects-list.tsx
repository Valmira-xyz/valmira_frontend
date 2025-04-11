'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { useDispatch, useSelector } from 'react-redux';

import { CreateProjectButton } from './create-project-button';
import { ChevronDown, Download, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ProjectSummaryCard } from '@/components/projects/project-summary-card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchProjects,
  fetchPublicProjects,
} from '@/store/slices/projectSlice';
import type { RootState } from '@/store/store';
import type { ProjectWithAddons } from '@/types';

interface ProjectsListProps {
  limit?: number;
  isPublic?: boolean;
  pageSize?: number;
}

export function ProjectsList({
  limit,
  isPublic = false,
  pageSize = 10,
}: ProjectsListProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector(
    (state: RootState) =>
      state.projects as unknown as {
        projects: ProjectWithAddons[];
        loading: boolean;
        error: string | null;
      }
  );
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All Bots');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2022, 0, 20), // Jan 20, 2022
    to: new Date(2022, 5, 9), // Jun 09, 2022
  });

  const isFirstRender = useRef(true);
  const fetchInProgress = useRef(false);
  const lastFetchParams = useRef({ isPublic, currentPage, pageSize });
  const fetchDelayTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced fetch function to prevent multiple API calls
  const loadProjects = useCallback(async () => {
    // Skip if a fetch is already in progress or if parameters haven't changed
    if (fetchInProgress.current) {
      console.log('Fetch already in progress, skipping duplicate request');
      return;
    }

    const paramsChanged =
      lastFetchParams.current.isPublic !== isPublic ||
      lastFetchParams.current.currentPage !== currentPage ||
      lastFetchParams.current.pageSize !== pageSize;

    if (!isFirstRender.current && !paramsChanged) {
      console.log('Parameters have not changed, using existing data');
      return;
    }

    try {
      fetchInProgress.current = true;
      console.log(
        `Loading projects: isPublic=${isPublic}, page=${currentPage}, size=${pageSize}`
      );

      // Update last fetch parameters
      lastFetchParams.current = { isPublic, currentPage, pageSize };

      if (isPublic) {
        await dispatch(
          fetchPublicProjects({
            pageIndex: currentPage,
            maxPageCount: pageSize,
          }) as any
        );
      } else {
        await dispatch(fetchProjects() as any);
      }

      isFirstRender.current = false;
    } finally {
      fetchInProgress.current = false;
    }
  }, [dispatch, isPublic, currentPage, pageSize]);

  // Clear any existing timer when parameters change
  useEffect(() => {
    if (fetchDelayTimer.current) {
      clearTimeout(fetchDelayTimer.current);
      fetchDelayTimer.current = null;
    }

    // Use longer delay for initial page load to avoid rate limiting
    const delay = isFirstRender.current ? 1500 : 800;
    console.log(`Scheduling data fetch with ${delay}ms delay`);

    fetchDelayTimer.current = setTimeout(() => {
      loadProjects();
    }, delay);

    return () => {
      if (fetchDelayTimer.current) {
        clearTimeout(fetchDelayTimer.current);
      }
    };
  }, [loadProjects]);

  useEffect(() => {
    if (error && !isPublic) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast, isPublic]);

  // Filter projects based on search query and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      searchQuery === '' ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.tokenAddress &&
        project.tokenAddress.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'All Bots' || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const displayedProjects = limit
    ? filteredProjects.slice(0, limit)
    : filteredProjects;

  const handleCreateNew = () => {
    router.push('/projects/new');
  };

  const handleExport = () => {
    // Don't export if no projects to export
    if (displayedProjects.length === 0) {
      toast({
        title: 'Export Failed',
        description: 'No projects available to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Define CSV headers based on the project data structure
      const headers = [
        'Project ID',
        'Name',
        'Token Address',
        'Pair Address',
        'Chain',
        'Symbol',
        'Status',
        'Created Date',
        'Active Bots',
        'Volume (24h)',
        'Cumulative Profit',
      ];

      // Convert displayed projects to CSV rows
      const csvData = displayedProjects.map((project) => {
        // Format the data for CSV
        return [
          project._id,
          project.name,
          project.tokenAddress || '',
          project.pairAddress || '',
          project.chainName || '',
          project.symbol || '',
          project.status || '',
          new Date(project.createdAt).toLocaleDateString(),
          project.metrics?.activeBots || 0,
          project.metrics?.volume24h || 0,
          project.metrics?.cumulativeProfit || 0,
        ];
      });

      // Convert arrays to CSV format
      const csvContent = [
        headers.join(','),
        ...csvData.map((row) =>
          row
            .map((cell) =>
              typeof cell === 'string' && cell.includes(',')
                ? `"${cell}"`
                : cell
            )
            .join(',')
        ),
      ].join('\n');

      // Create a Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Set up download attributes
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `projects_export_${date}.csv`);
      link.style.visibility = 'hidden';

      // Append to document, trigger download and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: 'Your projects data has been exported as CSV',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while exporting data',
        variant: 'destructive',
      });
    }
  };

  // Pagination handlers with debounce
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => Math.max(0, prev - 1));
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (!loading && displayedProjects.length >= pageSize) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [loading, displayedProjects?.length, pageSize]);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-4 pl-4 md:pl-6">
          <div className="relative w-full md:max-w-[260px] max-md:pr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-3 overflow-x-scroll no-scrollbar">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[180px]">
                  Status: {statusFilter}{' '}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('All Bots')}>
                  All Bots
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Active')}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Paused')}>
                  Paused
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="min-w-[260px]"
            />

            <Button
              variant="outline"
              className="ml-auto"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>

            <CreateProjectButton />
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-6">
          {displayedProjects.map((project) => (
            <ProjectSummaryCard key={project._id} project={project} />
          ))}
        </div>

        {/* Pagination (if needed) */}
        {isPublic && !limit && displayedProjects.length > 0 && (
          <div className="flex justify-center items-center mt-4 gap-2">
            <Button
              variant="outline"
              onClick={handlePreviousPage}
              disabled={currentPage === 0 || loading}
            >
              Previous
            </Button>
            <span className="mx-2">Page {currentPage + 1}</span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={displayedProjects.length < pageSize || loading}
            >
              Next
            </Button>
          </div>
        )}

        {/* Empty state */}
        {displayedProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No projects found</p>
            Create your first project by clicking the button "Create New
            Project"
          </div>
        )}
      </div>
    </div>
  );
}
