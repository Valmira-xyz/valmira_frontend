'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { DateRange } from 'react-day-picker';
import { useDispatch, useSelector } from 'react-redux';

import {
  format,
  isWithinInterval,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';
import { ChevronDown, Download } from 'lucide-react';
import { useParams } from 'next/navigation';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { BotFilter } from '@/components/projects/bot-filter';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type {
  ActivityLog,
  BotPerformanceHistory,
  TimeSeriesDataPoint,
} from '@/services/projectService';
import { projectService } from '@/services/projectService';
import { RootState } from '@/store/store';

type TimePeriod = '24h' | '7d' | '1m' | '1y';

// Utility function to format milliseconds to a readable duration
const formatUptime = (ms: number): string => {
  if (isNaN(ms) || ms <= 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// Utility function to extract the base bot name from the full identifier
const extractBaseBotName = (fullBotName: string): string => {
  if (!fullBotName) return '';

  // Split by hyphen and return the first part
  // e.g., "SnipeBot-2b68b4a081df1ba11c" becomes "SnipeBot"
  const parts = fullBotName.split('-');
  return parts[0];
};

// Utility function to safely check if a value is a valid date
const isValidDate = (value: any): boolean => {
  if (!value) return false;

  try {
    // For Date objects
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }

    // For timestamps (numbers) and ISO date strings
    const date = new Date(value);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

// Utility function to safely convert a value to a Date object
const toSafeDate = (value: any): Date | null => {
  if (!value) return null;

  try {
    // For Date objects
    if (value instanceof Date) {
      return !isNaN(value.getTime()) ? value : null;
    }

    // For timestamps (numbers) and ISO date strings
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date : null;
  } catch (error) {
    return null;
  }
};

// Define the imperative handle interface
export interface ProjectAnalyticsHandle {
  refreshData: () => Promise<void>;
}

interface ProjectAnalyticsProps {
  project?: {
    _id: string;
    botPerformance?: BotPerformanceHistory[];
    recentActivity?: ActivityLog[];
  };
  ref?: React.Ref<ProjectAnalyticsHandle>;
}

// Convert to forwardRef component to expose methods to parent
export const ProjectAnalytics = forwardRef<
  ProjectAnalyticsHandle,
  ProjectAnalyticsProps
>(({ project }, ref) => {
  const [volumeTrends, setVolumeTrends] = useState<TimeSeriesDataPoint[]>([]);
  const [profitTrends, setProfitTrends] = useState<TimeSeriesDataPoint[]>([]);
  const [profitTimePeriod, setProfitTimePeriod] = useState<TimePeriod>('24h');
  const [volumeTimePeriod, setVolumeTimePeriod] = useState<TimePeriod>('24h');
  const { projectStats, loading } = useSelector(
    (state: RootState) => state.projects
  );
  const dispatch = useDispatch();
  const { id: projectId } = useParams() as { id: string };

  // Bot performance and activity data state
  const [botPerformanceData, setBotPerformanceData] = useState<
    BotPerformanceHistory[]
  >([]);
  const [activityLogData, setActivityLogData] = useState<ActivityLog[]>([]);
  const [isLoadingBotPerformance, setIsLoadingBotPerformance] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Date range states
  const [botPerformanceDateRange, setBotPerformanceDateRange] = useState<
    DateRange | undefined
  >({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [activityLogDateRange, setActivityLogDateRange] = useState<
    DateRange | undefined
  >({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Bot filter states
  const [selectedBotPerformance, setSelectedBotPerformance] = useState<
    string | null
  >(null);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);

  // UI expansion states
  const [isBotPerformanceExpanded, setBotPerformanceExpanded] = useState(false);
  const [isActivityLogExpanded, setActivityLogExpanded] = useState(false);

  // Refs to prevent duplicate API calls
  const botPerformanceFetchInProgress = useRef(false);
  const recentActivityFetchInProgress = useRef(false);
  const initialRenderComplete = useRef(false);
  const lastBotPerformanceFetchParams = useRef<{
    projectId: string | undefined;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({
    projectId: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const lastActivityFetchParams = useRef<{
    projectId: string | undefined;
    limit: number | undefined;
  }>({
    projectId: undefined,
    limit: undefined,
  });

  // Refs to prevent duplicate API calls for trending data
  const trendingFetchInProgress = useRef(false);
  const lastTrendingFetchParams = useRef<{
    projectId: string | undefined;
    profitPeriod: TimePeriod | undefined;
    volumePeriod: TimePeriod | undefined;
  }>({
    projectId: undefined,
    profitPeriod: undefined,
    volumePeriod: undefined,
  });

  // Add a new ref to track refresh requests
  const refreshInProgress = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Expose methods to parent component via useImperativeHandle
  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      // Clear any pending refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      // Set a small delay to prevent accidental double-clicks
      return new Promise((resolve) => {
        refreshTimeoutRef.current = setTimeout(async () => {
          try {
            await fetchTrendingData(true); // Pass true to force refresh
            await fetchBotPerformance();
            await fetchActivityLog();
            resolve();
          } catch (error) {
            console.error('Error refreshing analytics data:', error);
            resolve(); // Resolve even on error to prevent hanging promises
          }
        }, 100);
      });
    },
  }));

  // Filtered data memoization
  const filteredBotPerformanceData = useMemo(() => {
    return botPerformanceData
      .filter((bot) => {
        const dateInRange =
          botPerformanceDateRange?.from && botPerformanceDateRange?.to
            ? isWithinInterval(new Date(bot.lastUpdated || bot.date), {
                start: botPerformanceDateRange.from,
                end: botPerformanceDateRange.to,
              })
            : true;

        const matchesBot = selectedBotPerformance
          ? bot.botName === selectedBotPerformance
          : true;

        return dateInRange && matchesBot;
      })
      .sort(
        (a, b) =>
          new Date(b.lastUpdated || b.date).getTime() -
          new Date(a.lastUpdated || a.date).getTime()
      );
  }, [botPerformanceData, botPerformanceDateRange, selectedBotPerformance]);

  const filteredActivityLogData = useMemo(() => {
    return activityLogData
      .filter((activity) => {
        const dateInRange =
          activityLogDateRange?.from && activityLogDateRange?.to
            ? isWithinInterval(new Date(activity.timestamp), {
                start: activityLogDateRange.from,
                end: activityLogDateRange.to,
              })
            : true;

        const matchesBot = selectedBot
          ? activity.botName === selectedBot
          : true;

        return dateInRange && matchesBot;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [activityLogData, activityLogDateRange, selectedBot]);

  // Fetch bot performance data
  const fetchBotPerformance = useCallback(async () => {
    if (
      !projectId ||
      isLoadingBotPerformance ||
      !botPerformanceDateRange?.from ||
      !botPerformanceDateRange?.to
    )
      return;

    const newParams = {
      projectId,
      startDate: botPerformanceDateRange.from,
      endDate: botPerformanceDateRange.to,
    };

    // Skip if params haven't changed
    const paramsUnchanged =
      lastBotPerformanceFetchParams.current.projectId === newParams.projectId &&
      lastBotPerformanceFetchParams.current.startDate?.getTime() ===
        newParams.startDate.getTime() &&
      lastBotPerformanceFetchParams.current.endDate?.getTime() ===
        newParams.endDate.getTime();

    if (paramsUnchanged) return;

    try {
      setIsLoadingBotPerformance(true);
      lastBotPerformanceFetchParams.current = newParams;

      const response = await projectService.getBotPerformanceHistory(
        projectId,
        botPerformanceDateRange.from,
        botPerformanceDateRange.to
      );

      setBotPerformanceData(response.data);
    } catch (error) {
      console.error('Error fetching bot performance:', error);
    } finally {
      setIsLoadingBotPerformance(false);
    }
  }, [projectId, botPerformanceDateRange]);

  // Fetch activity log data
  const fetchActivityLog = useCallback(async () => {
    if (!projectId || isLoadingActivity) return;

    const newParams = {
      projectId,
      limit: 100, // Adjust this value based on your needs
    };

    // Skip if params haven't changed
    const paramsUnchanged =
      lastActivityFetchParams.current.projectId === newParams.projectId &&
      lastActivityFetchParams.current.limit === newParams.limit;

    if (paramsUnchanged) return;

    try {
      setIsLoadingActivity(true);
      lastActivityFetchParams.current = newParams;

      const activityData = await projectService.getRecentActivity(
        projectId,
        newParams.limit
      );
      setActivityLogData(activityData);
    } catch (error) {
      console.error('Error fetching activity log:', error);
    } finally {
      setIsLoadingActivity(false);
    }
  }, [projectId]);

  // Initial data fetch
  useEffect(() => {
    fetchBotPerformance();
    fetchActivityLog();
  }, [fetchBotPerformance, fetchActivityLog]);

  // Fetch bot performance when date range changes
  useEffect(() => {
    fetchBotPerformance();
  }, [botPerformanceDateRange, fetchBotPerformance]);

  // Initial render optimization - use a lightweight synchronous render first, then update asynchronously
  useEffect(() => {
    if (!initialRenderComplete.current) {
      // Mark initial render as complete
      initialRenderComplete.current = true;

      // Defer any expensive operations until after initial render
      setTimeout(() => {
        // Force a re-render to get the complete data view
        // This is more efficient than doing expensive operations during the initial render
        dispatch({ type: 'FORCE_ANALYTICS_UPDATE' });
      }, 10);
    }
  }, [dispatch]);

  // Get available bots from performance data - optimized for rendering speed
  const initialAvailableBots = useMemo(() => {
    // For initial render, just use the props data without waiting for Redux
    if (project?.botPerformance && project.botPerformance.length > 0) {
      const botMap = new Map<string, { id: string; name: string }>();

      project.botPerformance.forEach((bot) => {
        if (!botMap.has(bot.botName)) {
          botMap.set(bot.botName, {
            id: bot.botName,
            name: bot.botName,
          });
        }
      });

      return Array.from(botMap.values());
    }

    return [];
  }, [project?.botPerformance]); // Only depends on props

  // Full available bots calculation that includes Redux data
  const availableBots = useMemo(() => {
    // Start with the initial bots from props
    const botMap = new Map<string, { id: string; name: string }>();

    // Add initial bots from props first
    initialAvailableBots.forEach((bot) => {
      if (!botMap.has(bot.id)) {
        botMap.set(bot.id, bot);
      }
    });

    // Then add any additional bots from Redux store
    const storePerformance = projectStats?.botPerformance as
      | BotPerformanceHistory[]
      | undefined;
    storePerformance?.forEach((bot) => {
      if (!botMap.has(bot.botId)) {
        botMap.set(bot.botId, {
          id: bot.botId,
          name: bot.botName,
        });
      }
    });

    // If we still have no bots and there's recentActivity data, extract bot names from there
    if (
      botMap.size === 0 &&
      project?.recentActivity &&
      project.recentActivity.length > 0
    ) {
      project.recentActivity.forEach((activity) => {
        if (activity.botName && !botMap.has(activity.botName)) {
          botMap.set(activity.botName, {
            id: activity.botName,
            name: activity.botName,
          });
        }
      });
    }

    return Array.from(botMap.values());
  }, [
    initialAvailableBots,
    projectStats?.botPerformance,
    project?.recentActivity,
  ]);

  const TimePeriodButtons = ({
    currentPeriod,
    onChange,
  }: {
    currentPeriod: TimePeriod;
    onChange: (period: TimePeriod) => void;
  }) => (
    <div className="flex justify-start space-x-2 mb-4">
      {(['24h', '7d', '1m', '1y'] as TimePeriod[]).map((period) => (
        <Button
          key={period}
          variant={currentPeriod === period ? 'default' : 'outline'}
          onClick={() => onChange(period)}
        >
          {period}
        </Button>
      ))}
    </div>
  );

  // Function to export data as CSV
  const exportToCSV = (data: any[], filename: string) => {
    // Check if data is empty
    if (!data || !data.length || !data[0]) {
      console.warn('No data to export');
      return;
    }

    try {
      // Convert data to CSV format
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((item) => Object.values(item).join(','));
      const csv = [headers, ...rows].join('\n');

      // Create a blob and download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  // Function to get date range based on time period
  const getDateRangeForPeriod = (
    period: TimePeriod
  ): { start: Date; end: Date } => {
    const end = new Date();
    let start: Date;

    switch (period) {
      case '24h':
        start = subDays(end, 1);
        break;
      case '7d':
        start = subDays(end, 7);
        break;
      case '1m':
        start = subMonths(end, 1);
        break;
      case '1y':
        start = subYears(end, 1);
        break;
      default:
        start = subDays(end, 1);
    }

    return { start, end };
  };

  // Update fetchTrendingData to accept a force parameter
  const fetchTrendingData = useCallback(
    async (force = false) => {
      if (!projectId) return;

      const newParams = {
        projectId,
        profitPeriod: profitTimePeriod,
        volumePeriod: volumeTimePeriod,
      };

      // Skip if fetch is already in progress
      if (trendingFetchInProgress.current && !force) {
        return;
      }

      const paramsUnchanged =
        lastTrendingFetchParams.current.projectId === newParams.projectId &&
        lastTrendingFetchParams.current.profitPeriod ===
          newParams.profitPeriod &&
        lastTrendingFetchParams.current.volumePeriod === newParams.volumePeriod;

      // Skip if params haven't changed, unless force=true
      if (paramsUnchanged && !force) {
        return;
      }

      try {
        // Set the in-progress flag to prevent duplicate fetches
        trendingFetchInProgress.current = true;
        lastTrendingFetchParams.current = newParams;

        // Add exponential backoff for retries to prevent 429 errors
        let retryCount = 0;
        const maxRetries = 3;

        let profitData, volumeData;

        while (retryCount <= maxRetries) {
          try {
            // Fetch both trending datasets in parallel
            [profitData, volumeData] = await Promise.all([
              projectService.getProfitTrending(
                projectId,
                getDateRangeForPeriod(profitTimePeriod)
              ),
              projectService.getVolumeTrending(
                projectId,
                getDateRangeForPeriod(volumeTimePeriod)
              ),
            ]);

            // If successful, break out of retry loop
            break;
          } catch (error: any) {
            // If it's a 429 error, wait and retry
            if (error.status === 429 && retryCount < maxRetries) {
              retryCount++;
              // Exponential backoff: 1s, 2s, 4s, etc.
              const delay = Math.pow(2, retryCount) * 1000;
              await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
              // If it's not a 429 error or we've exceeded retries, rethrow
              throw error;
            }
          }
        }

        // Only update state if we have data
        if (profitData) setProfitTrends(profitData);
        if (volumeData) setVolumeTrends(volumeData);
      } catch (error) {
        console.error('Error fetching trending data:', error);
      } finally {
        // Always clear the in-progress flag when done
        trendingFetchInProgress.current = false;
      }
    },
    [projectId, profitTimePeriod, volumeTimePeriod]
  );

  // Single effect to handle both trending data fetches
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrendingData();
    }, 100);

    return () => clearTimeout(timer);
  }, [fetchTrendingData]);

  // Update the chartData memo to use the new state
  const chartData = useMemo(() => {
    return {
      profitTrend: profitTrends,
      volumeTrend: volumeTrends,
    };
  }, [profitTrends, volumeTrends]);

  // Modified loading check that shows content if props data is available
  // const isLoading = useMemo(() => {
  //   // If we have props data, don't show loading state even if Redux is loading
  //   const hasPropsData =
  //     (project?.botPerformance && project.botPerformance.length > 0) ||
  //     (project?.recentActivity && project.recentActivity.length > 0) ||
  //     (profitTrends && profitTrends.length > 0 && volumeTrends && volumeTrends.length > 0);

  //   // Or if we have Redux data
  //   const hasReduxData =
  //     (projectStats?.botPerformance && projectStats.botPerformance.length > 0) ||
  //     (projectStats?.recentActivity && projectStats.recentActivity.length > 0) ||
  //     (projectStats?.trends && (
  //       (projectStats.trends.profitTrend && projectStats.trends.profitTrend.length > 0) ||
  //       (projectStats.trends.volumeTrend && projectStats.trends.volumeTrend.length > 0))
  //     );

  //   // Check if we have filtered data
  //   const hasFilteredData =
  //     filteredBotPerformanceData.length > 0 ||
  //     filteredActivityLogData.length > 0;

  //   // Only show loading if Redux is loading AND we don't have any data to show
  //   return loading && !hasPropsData && !hasReduxData && !hasFilteredData;
  // }, [
  //   loading,
  //   project?.botPerformance, project?.recentActivity, profitTrends, volumeTrends,
  //   projectStats?.botPerformance, projectStats?.recentActivity, projectStats?.trends,
  //   filteredBotPerformanceData, filteredActivityLogData
  // ]);

  // if (isLoading) {
  //   return (
  //     <div className="space-y-6">
  //       <div className="grid gap-4 md:grid-cols-2">
  //         {[...Array(2)].map((_, i) => (
  //           <Card key={i}>
  //             <CardHeader>
  //               <Skeleton className="h-5 w-32" />
  //               <Skeleton className="h-4 w-48" />
  //             </CardHeader>
  //             <CardContent>
  //               <Skeleton className="h-[300px] w-full" />
  //             </CardContent>
  //           </Card>
  //         ))}
  //       </div>
  //     </div>
  //   )
  // }

  const renderBotPerformanceContent = () => {
    if (isLoadingBotPerformance) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bot Name</TableHead>
            <TableHead>Actions</TableHead>
            <TableHead>Trades</TableHead>
            <TableHead>Profit Contribution</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(isBotPerformanceExpanded
            ? filteredBotPerformanceData
            : filteredBotPerformanceData.slice(0, 3)
          ).map((bot: BotPerformanceHistory, index: number) => (
            <TableRow key={index}>
              <TableCell>{extractBaseBotName(bot.botName)}</TableCell>
              <TableCell>
                {bot?.action
                  ? bot?.action
                  : bot.profit === 0
                    ? 'Snipe'
                    : 'Sell'}
              </TableCell>
              <TableCell>{bot.trades}</TableCell>
              <TableCell>
                <span
                  className={
                    Number(bot.profit) > 0
                      ? 'text-green-600'
                      : Number(bot.profit) < 0
                        ? 'text-red-600'
                        : ''
                  }
                >
                  {formatCurrency(bot.profit)}
                </span>
              </TableCell>
              <TableCell>
                {format(
                  new Date(bot?.lastUpdated || bot?.date),
                  'dd/mm/yyyy HH:mm:ss'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderActivityLogContent = () => {
    if (isLoadingActivity) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    return (
      <ScrollArea className="h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bot</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isActivityLogExpanded
              ? filteredActivityLogData
              : filteredActivityLogData.slice(0, 3)
            ).map((activity: ActivityLog) => (
              <TableRow
                key={`${activity.timestamp}-${activity.botName}-${activity.action}`}
              >
                <TableCell className="font-medium">
                  {extractBaseBotName(activity.botName)}
                </TableCell>
                <TableCell>{activity.action}</TableCell>
                <TableCell>{formatCurrency(activity.volume)}</TableCell>
                <TableCell>
                  <span
                    className={
                      Number(activity.impact) > 0
                        ? 'text-green-600'
                        : Number(activity.impact) < 0
                          ? 'text-red-600'
                          : ''
                    }
                  >
                    {Number(activity.impact) > 0 ? '+' : ''}
                    {Number(activity.impact).toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell>
                  {format(new Date(activity.timestamp), 'dd/mm/yyyy HH:mm:ss')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
            <CardDescription>
              Trading profit over {profitTimePeriod}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimePeriodButtons
              currentPeriod={profitTimePeriod}
              onChange={setProfitTimePeriod}
            />
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.profitTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) =>
                      format(
                        value,
                        profitTimePeriod === '24h' ? 'HH:mm' : 'MMM dd'
                      )
                    }
                    interval="preserveStartEnd"
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    labelFormatter={(label) =>
                      format(
                        label as number,
                        profitTimePeriod === '24h'
                          ? 'HH:mm'
                          : 'MMM dd, yyyy HH:mm'
                      )
                    }
                    formatter={(value: any) => [
                      formatCurrency(value as number),
                      'Profit',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Volume Trend</CardTitle>
            <CardDescription>
              Trading volume over {volumeTimePeriod}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimePeriodButtons
              currentPeriod={volumeTimePeriod}
              onChange={setVolumeTimePeriod}
            />
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.volumeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) =>
                      format(
                        value,
                        volumeTimePeriod === '24h' ? 'HH:mm' : 'MMM dd'
                      )
                    }
                    interval="preserveStartEnd"
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    labelFormatter={(label) =>
                      format(
                        label as number,
                        volumeTimePeriod === '24h'
                          ? 'HH:mm'
                          : 'MMM dd, yyyy HH:mm'
                      )
                    }
                    formatter={(value: any) => [
                      formatCurrency(value as number),
                      'Volume',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Collapsible
        open={isBotPerformanceExpanded}
        onOpenChange={setBotPerformanceExpanded}
        className="w-full"
      >
        <Card>
          <CardHeader className="flex flex-row items-center flex-wrap gap-4 justify-between">
            <CardTitle>Bot Performance</CardTitle>
            <div className="flex items-center gap-2 overflow-x-scroll no-scrollbar">
              <BotFilter
                bots={availableBots}
                selectedBot={selectedBotPerformance}
                onSelectBot={setSelectedBotPerformance}
                className="min-w-[150px]"
              />
              <DateRangePicker
                dateRange={botPerformanceDateRange}
                onDateRangeChange={(range) => {
                  setBotPerformanceDateRange(range);
                }}
                className="min-w-[240px]"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="min-w-[40px]"
                    disabled={isLoadingBotPerformance}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      exportToCSV(
                        filteredBotPerformanceData,
                        'bot-performance.csv'
                      )
                    }
                  >
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isBotPerformanceExpanded ? 'Show Less' : 'Show More'}
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${isBotPerformanceExpanded ? 'rotate-180' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CardContent>
            {renderBotPerformanceContent()}
            {isBotPerformanceExpanded && !isLoadingBotPerformance && (
              <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {filteredBotPerformanceData.length} results found
                  {botPerformanceDateRange?.from &&
                    botPerformanceDateRange?.to && (
                      <>
                        {' '}
                        from{' '}
                        {format(
                          botPerformanceDateRange.from,
                          'MMM dd, yyyy'
                        )}{' '}
                        to {format(botPerformanceDateRange.to, 'MMM dd, yyyy')}
                      </>
                    )}
                  {selectedBotPerformance && (
                    <>
                      {' '}
                      for{' '}
                      {extractBaseBotName(
                        availableBots.find(
                          (bot) => bot.id === selectedBotPerformance
                        )?.name || ''
                      )}
                    </>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </Collapsible>

      <Collapsible
        open={isActivityLogExpanded}
        onOpenChange={setActivityLogExpanded}
        className="w-full"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <CardTitle>Recent Activity</CardTitle>
            <div className="flex items-center gap-2 overflow-x-scroll no-scrollbar">
              <BotFilter
                bots={availableBots}
                selectedBot={selectedBot}
                onSelectBot={setSelectedBot}
                className="min-w-[150px]"
              />
              <DateRangePicker
                dateRange={activityLogDateRange}
                onDateRangeChange={(range) => {
                  setActivityLogDateRange(range);
                }}
                className="min-w-[240px]"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="min-w-[40px]"
                    disabled={isLoadingActivity}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      exportToCSV(filteredActivityLogData, 'activity-log.csv')
                    }
                  >
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isActivityLogExpanded ? 'Show Less' : 'Show More'}
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${isActivityLogExpanded ? 'rotate-180' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CardContent>
            {renderActivityLogContent()}
            {isActivityLogExpanded && !isLoadingActivity && (
              <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {filteredActivityLogData.length} results found
                  {activityLogDateRange?.from && activityLogDateRange?.to && (
                    <>
                      {' '}
                      from {format(
                        activityLogDateRange.from,
                        'MMM dd, yyyy'
                      )}{' '}
                      to {format(activityLogDateRange.to, 'MMM dd, yyyy')}
                    </>
                  )}
                  {selectedBot && (
                    <>
                      {' '}
                      for{' '}
                      {extractBaseBotName(
                        availableBots.find((bot) => bot.id === selectedBot)
                          ?.name || ''
                      )}
                    </>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </Collapsible>
    </div>
  );
});

// Add display name for debugging
ProjectAnalytics.displayName = 'ProjectAnalytics';
