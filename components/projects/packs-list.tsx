'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { useDispatch, useSelector } from 'react-redux';

import { CreatePackButton } from './create-pack-button';
import { subWeeks } from 'date-fns';
import { motion } from 'framer-motion';
import { Download, FolderX, Search } from 'lucide-react';

import { PackSummaryCard } from '@/components/projects/pack-summary-card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker1';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { fetchPacks, fetchPublicPacks } from '@/store/slices/projectSlice';
import type { RootState } from '@/store/store';
import type { ProjectWithAddons } from '@/types';

interface PacksListProps {
  limit?: number;
  isPublic?: boolean;
  pageSize?: number;
}

export function PacksList({
  limit,
  isPublic = false,
  pageSize = 10,
}: PacksListProps) {
  const dispatch = useDispatch();
  const { packs, loading, error } = useSelector(
    (state: RootState) =>
      state.projects as unknown as {
        packs: ProjectWithAddons[];
        loading: boolean;
        error: string | null;
      }
  );
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All Bots');
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subWeeks(new Date(), 1), // one week ago
    to: new Date(), // now
  });

  const isFirstRender = useRef(true);
  const fetchInProgress = useRef(false);
  const lastFetchParams = useRef({ isPublic, currentPage, pageSize });
  const fetchDelayTimer = useRef<NodeJS.Timeout | null>(null);
  const firstPageFetchEnded = useRef(false);

  // Debounced fetch function to prevent multiple API calls
  const loadPacks = useCallback(async () => {
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

      // Update last fetch parameters
      lastFetchParams.current = { isPublic, currentPage, pageSize };

      if (isPublic) {
        console.log('🤖 [PacksList] fetching public packs');
        await dispatch(
          fetchPublicPacks({
            pageIndex: currentPage,
            maxPageCount: pageSize,
          }) as any
        );
      } else {
        console.log('🤖 [PacksList] fetching private packs');
        await dispatch(fetchPacks() as any);
      }

      if (currentPage === 0) {
        firstPageFetchEnded.current = true;
      } else {
        firstPageFetchEnded.current = false;
      }
      isFirstRender.current = false;
    } finally {
      fetchInProgress.current = false;
      if (currentPage === 0) {
        firstPageFetchEnded.current = true;
      } else {
        firstPageFetchEnded.current = false;
      }
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
      loadPacks();
    }, delay);

    return () => {
      if (fetchDelayTimer.current) {
        clearTimeout(fetchDelayTimer.current);
      }
    };
  }, [loadPacks]);

  useEffect(() => {
    if (error && !isPublic) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast, isPublic]);

  // Filter packs based on search query and status
  const filteredPacks = packs.filter((pack) => {
    const matchesSearch =
      searchQuery === '' ||
      pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pack.tokenAddress &&
        pack.tokenAddress.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'All Bots' ||
      (pack.status && pack.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  const displayedPacks = limit ? filteredPacks.slice(0, limit) : filteredPacks;

  const handleExport = () => {
    // Don't export if no packs to export
    if (displayedPacks.length === 0) {
      toast({
        title: 'Export Failed',
        description: 'No packs available to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Define CSV headers based on the pack data structure
      const headers = [
        'Pack ID',
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

      // Convert displayed packs to CSV rows
      const csvData = displayedPacks.map((pack) => {
        // Format the data for CSV
        return [
          pack._id,
          pack.name,
          pack.tokenAddress || '',
          pack.pairAddress || '',
          pack.chainName || '',
          pack.symbol || '',
          pack.status || '',
          new Date(pack.createdAt).toLocaleDateString(),
          pack.metrics?.activeBots || 0,
          pack.metrics?.tradingVolume || 0,
          pack.metrics?.cumulativeProfit || 0,
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
      link.setAttribute('download', `packs_export_${date}.csv`);
      link.style.visibility = 'hidden';

      // Append to document, trigger download and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: 'Your packs data has been exported as CSV',
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      toast({
        title: error.response?.data?.errorType || 'Export Failed',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'An error occurred while exporting data',
        variant: 'destructive',
      });
    }
  };

  // Pagination handlers with debounce
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setIsPageLoading(true);
      setCurrentPage((prev) => Math.max(0, prev - 1));
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (!loading && displayedPacks.length >= pageSize) {
      setIsPageLoading(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [loading, displayedPacks?.length, pageSize]);

  // Reset page loading state when data is loaded
  useEffect(() => {
    if (!loading) {
      setIsPageLoading(false);
    }
  }, [loading]);

  return (
    <motion.div
      className="my-6 space-y-6 h-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-6">
          <div className="relative w-full md:max-w-[260px] md:pr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:overflow-x-scroll sm:no-scrollbar">
            <div className="flex gap-3 justify-between">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-auto sm:min-w-[180px] text-start">
                  <SelectValue placeholder="Status">
                    <span className="inline-block w-full sm:max-w-[130px] pt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      Status: {statusFilter}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Bots" className="text-start">
                    Status: All Bots
                  </SelectItem>
                  <SelectItem value="Active" className="text-start">
                    Status: Active
                  </SelectItem>
                  <SelectItem value="Inactive" className="text-start">
                    Status: Inactive
                  </SelectItem>
                </SelectContent>
              </Select>

              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                className="w-auto sm:min-w-[260px] "
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="ml-auto w-full sm:w-auto"
                onClick={handleExport}
              >
                <Download className="sm:mr-2 h-4 w-4" /> Export
              </Button>

              <CreatePackButton buttonText="Create New" variant="default" />
            </div>
          </div>
        </div>

        {/* Pack Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 px-4 md:px-6 relative">
          {(loading || isPageLoading) && !isFirstRender.current && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          )}
          {displayedPacks.map((pack) => (
            <PackSummaryCard key={pack._id} project={pack} />
          ))}
        </div>

        {/* Empty state */}
        {displayedPacks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Spinner size="lg" />
              </div>
            ) : currentPage === 0 && firstPageFetchEnded.current === true ? (
              <>
                <FolderX className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No packs found</p>
                <p className="text-center">
                  Create your first pack by clicking the button "Create New
                  Pack"
                </p>
              </>
            ) : (
              <>
                <FolderX className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No more packs to display
                </p>
              </>
            )}
          </div>
        )}

        {/* Pagination (if needed) */}
        {isPublic && !limit && (
          <div className="flex justify-center items-center gap-2 mt-auto">
            <Button
              variant="outline"
              onClick={handlePreviousPage}
              disabled={currentPage === 0 || loading}
            >
              {loading && currentPage > 0 ? (
                <Spinner size="sm" hasText={false} className="mr-2" />
              ) : null}
              Previous
            </Button>
            <span className="mx-2">Page {currentPage + 1}</span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={
                displayedPacks.length < pageSize ||
                loading ||
                displayedPacks.length === 0
              }
            >
              {loading && displayedPacks.length >= pageSize ? (
                <Spinner size="sm" hasText={false} className="mr-2" />
              ) : null}
              Next
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
