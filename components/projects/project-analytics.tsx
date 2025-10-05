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
import { useDispatch } from 'react-redux';

import { addDays, subWeeks } from 'date-fns';
import { useParams } from 'next/navigation';

import { DataChart } from '@/components/ui/data-chart';
import { DataTable } from '@/components/ui/data-table';
import type {
  ActivityLog,
  BotPerformanceHistory,
  TimeSeriesDataPoint,
} from '@/services/projectService';
import { projectService } from '@/services/projectService';
import websocketService, { WebSocketEvents } from '@/services/websocketService';

// Utility function to format milliseconds to a readable duration
// const formatUptime = (ms: number): string => {
//   if (isNaN(ms) || ms <= 0) return '0s';

//   const seconds = Math.floor(ms / 1000);
//   const minutes = Math.floor(seconds / 60);
//   const hours = Math.floor(minutes / 60);
//   const days = Math.floor(hours / 24);

//   if (days > 0) {
//     return `${days}d ${hours % 24}h`;
//   } else if (hours > 0) {
//     return `${hours}h ${minutes % 60}m`;
//   } else if (minutes > 0) {
//     return `${minutes}m ${seconds % 60}s`;
//   } else {
//     return `${seconds}s`;
//   }
// };

// Utility function to extract the base bot name from the full identifier
// const extractBaseBotName = (fullBotName: string): string => {
//   if (!fullBotName) return '';

//   // Split by hyphen and return the first part
//   // e.g., "SnipeBot-2b68b4a081df1ba11c" becomes "SnipeBot"
//   const parts = fullBotName.split('-');
//   return parts[0];
// };

// Utility function to safely check if a value is a valid date
// const isValidDate = (value: any): boolean => {
//   if (!value) return false;

//   try {
//     // For Date objects
//     if (value instanceof Date) {
//       return !isNaN(value.getTime());
//     }

//     // For timestamps (numbers) and ISO date strings
//     const date = new Date(value);
//     return !isNaN(date.getTime());
//   } catch (error) {
//     return false;
//   }
// };

// // Utility function to safely convert a value to a Date object
// const toSafeDate = (value: any): Date | null => {
//   if (!value) return null;

//   try {
//     // For Date objects
//     if (value instanceof Date) {
//       return !isNaN(value.getTime()) ? value : null;
//     }

//     // For timestamps (numbers) and ISO date strings
//     const date = new Date(value);
//     return !isNaN(date.getTime()) ? date : null;
//   } catch (error) {
//     return null;
//   }
// };

// Add a helper function to get end-of-day date
const getEndOfDay = (date: Date): Date => {
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
};

// Define the imperative handle interface
export interface ProjectAnalyticsHandle {
  refreshData: () => Promise<void>;
}

interface ProjectAnalyticsProps {
  ref?: React.Ref<ProjectAnalyticsHandle>;
}

// Convert to forwardRef component to expose methods to parent
export const ProjectAnalytics = forwardRef<
  ProjectAnalyticsHandle,
  ProjectAnalyticsProps
>((_, ref) => {
  // data for charts
  const [volumeTrends, setVolumeTrends] = useState<TimeSeriesDataPoint[]>([]);
  const [profitTrends, setProfitTrends] = useState<TimeSeriesDataPoint[]>([]);

  // data for tables
  const [botPerformanceData, setBotPerformanceData] = useState<
    BotPerformanceHistory[]
  >([]);
  const [activityLogData, setActivityLogData] = useState<ActivityLog[]>([]);

  // loading states
  const [isLoadingBotPerformance, setIsLoadingBotPerformance] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isLoadingProfitTrends, setIsLoadingProfitTrends] = useState(false);
  const [isLoadingVolumeTrends, setIsLoadingVolumeTrends] = useState(false);

  // Date range states
  const [botPerformanceDateRange, setBotPerformanceDateRange] = useState<
    DateRange | undefined
  >({
    from: subWeeks(new Date(), 1),
    to: addDays(new Date(), 3),
  });
  const [activityLogDateRange, setActivityLogDateRange] = useState<
    DateRange | undefined
  >({
    from: subWeeks(new Date(), 1),
    to: new Date(),
  });

  const [profitDateRange, setProfitDateRange] = useState<DateRange | undefined>(
    {
      from: subWeeks(new Date(), 1),
      to: new Date(),
    }
  );
  const [volumeDateRange, setVolumeDateRange] = useState<DateRange | undefined>(
    {
      from: subWeeks(new Date(), 1),
      to: new Date(),
    }
  );

  const dispatch = useDispatch();
  const { id: projectId } = useParams() as { id: string };

  // Refs to prevent duplicate API calls
  const initialRenderComplete = useRef(false);
  const lastActivityFetchParams = useRef<{
    projectId: string | undefined;
    timeRange: { start: Date; end: Date } | undefined;
  }>({
    projectId: undefined,
    timeRange: undefined,
  });
  const lastBotPerformanceFetchParams = useRef<{
    projectId: string | undefined;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({
    projectId: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  // const { toast } = useToast();

  // Add a new ref to track refresh requests
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket integration
  // Memoize the handlers to prevent recreation on re-renders
  const handleBotPerformanceUpdate = useCallback(
    (data: any) => {
      if (data.projectId === projectId && data.botId && data.performance) {
        console.log(
          `🤖 [ProjectAnalytics] Received new bot performance data:`,
          {
            event: WebSocketEvents.BOT_PERFORMANCE_UPDATED,
            timestamp: new Date().toISOString(),
            projectId: data.projectId,
            botId: data.botId,
            botName:
              data.performance.botName || `Bot-${data.botId.substring(0, 8)}`,
            currentDataSize: botPerformanceData.length,
            performance: {
              ...data.performance,
              profit:
                typeof data.performance.profit === 'number'
                  ? `${data.performance.profit > 0 ? '+' : ''}${data.performance.profit.toFixed(4)}`
                  : data.performance.profit,
            },
          }
        );

        const newPerformanceData = {
          botId: data.botId,
          botName:
            data.performance.botName || `Bot-${data.botId.substring(0, 8)}`,
          ...data.performance,
          // Ensure profitContribution is properly transferred from the update data
          profitContribution:
            data.performance.profitContribution !== undefined
              ? data.performance.profitContribution
              : data.performance.profit,
          status: data.performance.status,
          action: data.performance.action,
          date: new Date().toISOString(),
          trades: data.performance.trades || 0,
          profit: data.performance.profit || 0,
          lastUpdated: new Date().toISOString(),
        };

        // Update the bot performance data with the new data
        setBotPerformanceData((prev) => {
          const updatedData = [newPerformanceData, ...prev];
          console.log('🤖 [ProjectAnalytics] Added new bot performance:', {
            botId: data.botId,
            newData: newPerformanceData,
            timestamp: new Date().toISOString(),
          });
          return updatedData.sort(
            (a, b) =>
              new Date(b.lastUpdated || b.date).getTime() -
              new Date(a.lastUpdated || a.date).getTime()
          );
        });
      } else {
        console.warn(`🤖 [ProjectAnalytics] Invalid bot performance data:`, {
          event: WebSocketEvents.BOT_PERFORMANCE_UPDATED,
          hasProjectId: !!data.projectId,
          hasBotId: !!data.botId,
          hasPerformance: !!data.performance,
          expectedProjectId: projectId,
          actualProjectId: data.projectId,
          data,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [projectId, botPerformanceDateRange, botPerformanceData.length]
  );

  // Handle activity log updates with enhanced logging
  const handleActivityLogUpdate = useCallback(
    (data: any) => {
      if (data.projectId === projectId && data.activity) {
        console.log(`📝 [ProjectAnalytics] Received new activity data:`, {
          event: WebSocketEvents.ACTIVITY_LOG_ADDED,
          timestamp: new Date().toISOString(),
          projectId: data.projectId,
          currentActivitiesCount: activityLogData.length,
          activity: {
            ...data.activity,
            timestamp: data.activity.timestamp || new Date().toISOString(),
            botName: data.activity.botName || 'Unknown Bot',
            action: data.activity.action || 'Unknown Action',
          },
        });

        // Ensure the activity has all required fields
        const normalizedActivity = {
          ...data.activity,
          timestamp: data.activity.timestamp || new Date().toISOString(),
          botName: data.activity.botName || 'Unknown Bot',
          action: data.activity.action || 'Unknown Action',
          description: data.activity.description || 'No description provided',
          volume: data.activity.volume || 0,
          impact: data.activity.impact || 0,
        };

        // Always update the data regardless of filters to keep it complete
        setActivityLogData((prev) => {
          const updated = [normalizedActivity, ...prev];
          console.log('📝 [ProjectAnalytics] Updated activity log:', {
            newActivity: normalizedActivity,
            totalActivities: updated.length,
            timestamp: new Date().toISOString(),
          });
          return updated;
        });
      } else {
        console.warn(`📝 [ProjectAnalytics] Invalid activity data:`, {
          event: WebSocketEvents.ACTIVITY_LOG_ADDED,
          hasProjectId: !!data.projectId,
          hasActivity: !!data.activity,
          expectedProjectId: projectId,
          actualProjectId: data.projectId,
          data,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [projectId, activityLogDateRange, activityLogData.length]
  );

  // Handle distribution updates
  const handleDistributionUpdate = useCallback(
    (data: any) => {
      if (data.projectId === projectId && data.distributionBotId) {
        console.log(`🔄 [ProjectAnalytics] Received distribution update:`, {
          event: WebSocketEvents.DISTRIBUTION_UPDATES,
          timestamp: new Date().toISOString(),
          projectId: data.projectId,
          distributionBotId: data.distributionBotId,
          sourceWallets: data.sourceWallets,
          targetWallets: data.targetWallets,
          distributionStyle: data.distributionStyle,
          estimatedAmount: data.estimatedAmount,
          chainName: data.chainName,
          efficiency: data.efficiency,
        });

        // Create a distribution activity log entry
        const distributionActivity = {
          botName: `DistributionBot-${data.distributionBotId?.substring(6) || ''}`,
          timestamp: new Date(data.timestamp || Date.now()),
          action: 'Token Distribution Completed' as const,
          volume: data.estimatedAmount || 0,
          impact: data.efficiency || 0,
        };

        // Add to activity log data
        setActivityLogData((prev) => {
          const updated = [distributionActivity, ...prev];
          console.log('🔄 [ProjectAnalytics] Added distribution activity:', {
            distributionActivity,
            totalActivities: updated.length,
            timestamp: new Date().toISOString(),
          });
          return updated.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });

        // Also create a bot performance entry
        const performanceEntry = {
          botId: data.distributionBotId,
          botName: `DistributionBot-${data.distributionBotId?.substring(6) || ''}`,
          status: 'Active' as const,
          trades: data.totalWallets || data.sourceWallets + data.targetWallets,
          action: 'Token Distribution Completed' as const,
          profitContribution: 0,
          profit: 0,
          uptime: '0s',
          date: new Date().toISOString(),
          lastUpdated: new Date(),
        };

        // Add to bot performance data
        setBotPerformanceData((prev) => {
          const updated = [performanceEntry, ...prev];
          console.log('🔄 [ProjectAnalytics] Added distribution performance:', {
            performanceEntry,
            timestamp: new Date().toISOString(),
          });
          return updated.sort(
            (a, b) =>
              new Date(b.lastUpdated || b.date).getTime() -
              new Date(a.lastUpdated || a.date).getTime()
          );
        });
      } else {
        console.warn(`🔄 [ProjectAnalytics] Invalid distribution data:`, {
          event: WebSocketEvents.DISTRIBUTION_UPDATES,
          hasProjectId: !!data.projectId,
          hasDistributionBotId: !!data.distributionBotId,
          expectedProjectId: projectId,
          actualProjectId: data.projectId,
          data,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [projectId]
  );

  // Handle time series data updates
  const handleTimeSeriesUpdate = useCallback(
    (data: any) => {
      if (data.projectId === projectId && data.type && data.dataPoint) {
        console.log(`📈 [WebSocket] Received TIME_SERIES_UPDATED event:`, {
          event: WebSocketEvents.TIME_SERIES_UPDATED,
          timestamp: new Date().toISOString(),
          projectId: data.projectId,
          type: data.type,
          dataPoint: {
            ...data.dataPoint,
            timestamp: data.dataPoint.timestamp || new Date().toISOString(),
            value:
              typeof data.dataPoint.value === 'number'
                ? data.dataPoint.value.toFixed(4)
                : data.dataPoint.value,
          },
        });

        // Make sure the dataPoint has a timestamp
        const dataPointWithTimestamp = {
          ...data.dataPoint,
          timestamp: data.dataPoint.timestamp || new Date().toISOString(),
          // Ensure value is a number and use profitContribution for profit data if available
          value:
            data.type === 'profit' &&
            data.dataPoint.profitContribution !== undefined
              ? parseFloat(data.dataPoint.profitContribution.toString())
              : typeof data.dataPoint.value === 'number'
                ? data.dataPoint.value
                : parseFloat(data.dataPoint.value || '0'),
        };

        // Update the appropriate time series data
        if (data.type === 'profit') {
          console.log(
            `\n =============== profitData ===============\n${JSON.stringify(data, null, 2)}`
          );
          setProfitTrends((prev) => {
            // Check if datapoint is in the current time period
            // const { start, end } = memoizedGetDateRange(profitDateRange?.to?.toISOString() as TimePeriod);
            const { start, end } = {
              start:
                profitDateRange?.from ||
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              end: profitDateRange?.to || new Date(),
            };
            const dataPointDate = new Date(dataPointWithTimestamp.timestamp);
            const isInCurrentPeriod =
              dataPointDate >= start && dataPointDate <= getEndOfDay(end);

            if (!isInCurrentPeriod) {
              console.log(
                'Data point outside current time period, skipping chart update'
              );
              return prev;
            }

            const existingIndex = prev.findIndex(
              (point) => point.timestamp === dataPointWithTimestamp.timestamp
            );

            if (existingIndex >= 0) {
              // Update existing data point
              const updated = [...prev];
              updated[existingIndex] = dataPointWithTimestamp;
              return updated.sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              );
            } else {
              // Add new data point
              return [...prev, dataPointWithTimestamp].sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              );
            }
          });

          // Force refresh the chart after updating
          setTimeout(() => {
            dispatch({ type: 'FORCE_CHART_UPDATE', chartType: 'profit' });
          }, 100);
        } else if (data.type === 'volume') {
          console.log(
            `\n =============== volumeDate ===============\n${JSON.stringify(data, null, 2)}`
          );
          setVolumeTrends((prev) => {
            // Check if datapoint is in the current time period
            // const { start, end } = memoizedGetDateRange(volumeDateRange?.to?.toISOString() as TimePeriod);
            const { start, end } = {
              start:
                volumeDateRange?.from ||
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              end: volumeDateRange?.to || new Date(),
            };
            const dataPointDate = new Date(dataPointWithTimestamp.timestamp);
            const isInCurrentPeriod =
              dataPointDate >= start && dataPointDate <= getEndOfDay(end);

            if (!isInCurrentPeriod) {
              console.log(
                'Data point outside current time period, skipping chart update'
              );
              return prev;
            }

            const existingIndex = prev.findIndex(
              (point) => point.timestamp === dataPointWithTimestamp.timestamp
            );

            if (existingIndex >= 0) {
              // Update existing data point
              const updated = [...prev];
              updated[existingIndex] = dataPointWithTimestamp;
              return updated.sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              );
            } else {
              // Add new data point
              return [...prev, dataPointWithTimestamp].sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              );
            }
          });

          // Force refresh the chart after updating
          setTimeout(() => {
            dispatch({ type: 'FORCE_CHART_UPDATE', chartType: 'volume' });
          }, 100);
        } else {
          console.warn(`📈 [WebSocket] Unknown time series type: ${data.type}`);
        }
      } else {
        console.warn(
          `📈 [WebSocket] Invalid TIME_SERIES_UPDATED data received:`,
          {
            event: WebSocketEvents.TIME_SERIES_UPDATED,
            hasProjectId: !!data.projectId,
            hasType: !!data.type,
            hasDataPoint: !!data.dataPoint,
            expectedProjectId: projectId,
            actualProjectId: data.projectId,
            type: data.type,
            data,
          }
        );
      }
    },
    [projectId, profitDateRange, volumeDateRange, dispatch]
  );

  useEffect(() => {
    if (!projectId) return;

    // console.log(`🔌 Setting up WebSocket handlers for project ${projectId}`);

    // Ensure connection and join project room
    websocketService.connect();
    websocketService.joinProject(projectId);

    // Subscribe to WebSocket events
    websocketService.subscribe(
      WebSocketEvents.BOT_PERFORMANCE_UPDATED,
      handleBotPerformanceUpdate
    );
    websocketService.subscribe(
      WebSocketEvents.ACTIVITY_LOG_ADDED,
      handleActivityLogUpdate
    );
    websocketService.subscribe(
      WebSocketEvents.TIME_SERIES_UPDATED,
      handleTimeSeriesUpdate
    );
    websocketService.subscribe(
      WebSocketEvents.DISTRIBUTION_UPDATES,
      handleDistributionUpdate
    );

    // Cleanup on unmount
    return () => {
      // console.log(`🔌 Cleaning up WebSocket handlers for project ${projectId}`);
      websocketService.unsubscribe(
        WebSocketEvents.BOT_PERFORMANCE_UPDATED,
        handleBotPerformanceUpdate
      );
      websocketService.unsubscribe(
        WebSocketEvents.ACTIVITY_LOG_ADDED,
        handleActivityLogUpdate
      );
      websocketService.unsubscribe(
        WebSocketEvents.TIME_SERIES_UPDATED,
        handleTimeSeriesUpdate
      );
      websocketService.unsubscribe(
        WebSocketEvents.DISTRIBUTION_UPDATES,
        handleDistributionUpdate
      );
      websocketService.leaveProject(projectId);
    };
  }, [
    projectId,
    handleBotPerformanceUpdate,
    handleActivityLogUpdate,
    handleTimeSeriesUpdate,
    handleDistributionUpdate,
  ]);

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
            await fetchProfitTrends();
            await fetchVolumeTrends();
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
  // const filteredBotPerformanceData = useMemo(() => {
  //   return botPerformanceData
  //     .filter((bot) => {
  //       const dateInRange =
  //         botPerformanceDateRange?.from && botPerformanceDateRange?.to
  //           ? isWithinInterval(new Date(bot.lastUpdated || bot.date), {
  //               start: botPerformanceDateRange.from,
  //               end: getEndOfDay(botPerformanceDateRange.to),
  //             })
  //           : true;

  //       return dateInRange && matchesBot;
  //     })
  //     .sort(
  //       (a, b) =>
  //         new Date(b.lastUpdated || b.date).getTime() -
  //         new Date(a.lastUpdated || a.date).getTime()
  //     );
  // }, [botPerformanceData, botPerformanceDateRange, selectedBotPerformance]);

  // const filteredActivityLogData = useMemo(() => {
  //   return activityLogData
  //     .filter((activity) => {
  //       const dateInRange =
  //         activityLogDateRange?.from && activityLogDateRange?.to
  //           ? isWithinInterval(new Date(activity.timestamp), {
  //               start: activityLogDateRange.from,
  //               end: getEndOfDay(activityLogDateRange.to),
  //             })
  //           : true;

  //       const matchesBot = selectedBot
  //         ? activity.botName === selectedBot
  //         : true;

  //       return dateInRange && matchesBot;
  //     })
  //     .sort(
  //       (a, b) =>
  //         new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  //     );
  // }, [activityLogData, activityLogDateRange, selectedBot]);

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
        newParams.startDate,
        newParams.endDate
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

    const newTimeRange = activityLogDateRange
      ? {
          start:
            activityLogDateRange.from ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: activityLogDateRange.to || new Date(),
        }
      : {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
        };

    const newParams = {
      projectId,
      timeRange: newTimeRange,
    };

    // Skip if params haven't changed
    const currentParams = lastActivityFetchParams.current;
    const paramsUnchanged =
      currentParams.projectId === newParams.projectId &&
      currentParams.timeRange?.start.getTime() ===
        newTimeRange.start.getTime() &&
      currentParams.timeRange?.end.getTime() === newTimeRange.end.getTime();

    if (paramsUnchanged) return;

    try {
      setIsLoadingActivity(true);
      lastActivityFetchParams.current = newParams;

      const activityData = await projectService.getRecentActivity(
        projectId,
        newTimeRange
      );
      setActivityLogData(activityData);
    } catch (error) {
      console.error('Error fetching activity log:', error);
    } finally {
      setIsLoadingActivity(false);
    }
  }, [projectId, activityLogDateRange]);

  // Initial data fetch
  useEffect(() => {
    fetchBotPerformance();
    fetchActivityLog();
  }, [fetchBotPerformance, fetchActivityLog]);

  // Fetch bot performance when date range changes
  useEffect(() => {
    fetchBotPerformance();
  }, [botPerformanceDateRange, fetchBotPerformance]);

  // Fetch activity log when date range changes
  useEffect(() => {
    fetchActivityLog();
  }, [activityLogDateRange, fetchActivityLog]);

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

  // Fetch profit trends individually
  const fetchProfitTrends = useCallback(async () => {
    console.log('fetchProfitTrends is called');
    if (!projectId || !profitDateRange?.from || !profitDateRange?.to) return;
    try {
      setIsLoadingProfitTrends(true);
      const profitData = await projectService.getProfitTrending(projectId, {
        start: profitDateRange.from,
        end: profitDateRange.to,
      });
      setProfitTrends(profitData);
    } catch (error) {
      console.error('Error fetching profit trends:', error);
    } finally {
      setIsLoadingProfitTrends(false);
    }
  }, [projectId, profitDateRange]);

  // Fetch volume trends individually
  const fetchVolumeTrends = useCallback(async () => {
    console.log('fetchVolumeTrends is called');
    if (!projectId || !volumeDateRange?.from || !volumeDateRange?.to) return;
    try {
      setIsLoadingVolumeTrends(true);
      const volumeData = await projectService.getVolumeTrending(projectId, {
        start: volumeDateRange.from,
        end: volumeDateRange.to,
      });
      setVolumeTrends(volumeData);
    } catch (error) {
      console.error('Error fetching volume trends:', error);
    } finally {
      setIsLoadingVolumeTrends(false);
    }
  }, [projectId, volumeDateRange]);

  // Fetch profit trends when profitDateRange changes
  useEffect(() => {
    fetchProfitTrends();
  }, [projectId, fetchProfitTrends]);

  // Fetch volume trends when volumeDateRange changes
  useEffect(() => {
    fetchVolumeTrends();
  }, [projectId, fetchVolumeTrends]);

  const filterOption = useMemo(
    () => ({
      key: { label: 'Bot Name', value: 'botName' },
      options: [
        'All',
        'VolumeBot',
        'AutoSellBot',
        'SnipeBot',
        'HolderBot',
        'DistributionBot',
      ],
    }),
    []
  );

  // console.log(
  //   `\n =============== table 1 data ===============\n${JSON.stringify(botPerformanceData, null, 2)}`
  // );
  // console.log(`\n =============== table 2 data ===============\n${JSON.stringify(activityLogData, null, 2)}`)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <DataChart
          title="Profit Trend"
          description="Trading profit"
          data={profitTrends}
          yKey="value"
          xKey="timestamp"
          color="hsl(var(--chart-1))"
          isLoading={isLoadingProfitTrends}
          showDateRange={true}
          showDateButtons={true}
          showChartTypeSelector={false}
          showHeaderInVertical={true}
          dateRange={profitDateRange}
          onDateRangeChange={setProfitDateRange}
        />

        <DataChart
          title="Trading Volume Trend"
          description="Trading volume"
          data={volumeTrends}
          yKey="value"
          xKey="timestamp"
          color="hsl(var(--chart-1))"
          isLoading={isLoadingVolumeTrends}
          showDateRange={true}
          showDateButtons={true}
          showChartTypeSelector={false}
          showHeaderInVertical={true}
          dateRange={volumeDateRange}
          onDateRangeChange={setVolumeDateRange}
        />
      </div>

      <DataTable
        title="Bot Performance"
        description=""
        data={botPerformanceData}
        showColumns={[
          { name: 'botName', type: 'normal' },
          { name: 'action', type: 'normal' },
          { name: 'trades', type: 'normal' },
          { name: 'profit', type: 'price', displayName: 'Profit Contribution' },
          { name: 'timestamp', type: 'time', displayName: 'Time' },
        ]}
        filterOption={filterOption}
        isLoading={isLoadingBotPerformance}
        showSearchInput={true}
        showCheckbox={true}
        showPagination={true}
        showDateRange={true}
        showDateButtons={true}
        showDownloadButton={true}
        showTableHeaderInVertical={true}
        dateRange={botPerformanceDateRange}
        onDateRangeChange={setBotPerformanceDateRange}
      />

      <DataTable
        title="Recent Activity"
        description=""
        data={activityLogData}
        showColumns={[
          { name: 'botName', type: 'normal' },
          { name: 'action', type: 'normal' },
          { name: 'volume', type: 'price' },
          { name: 'timestamp', type: 'time', displayName: 'Time' },
        ]}
        filterOption={filterOption}
        isLoading={isLoadingActivity}
        showSearchInput={true}
        showCheckbox={true}
        showPagination={true}
        showDateRange={true}
        showDateButtons={true}
        showDownloadButton={true}
        showTableHeaderInVertical={true}
        dateRange={activityLogDateRange}
        onDateRangeChange={setActivityLogDateRange}
      />
    </div>
  );
});

// Add display name for debugging
ProjectAnalytics.displayName = 'ProjectAnalytics';
