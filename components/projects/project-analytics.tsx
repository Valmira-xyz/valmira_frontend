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

import { format, isWithinInterval, subDays, subMonths, subWeeks } from 'date-fns';

import { useParams } from 'next/navigation';

import type {
  ActivityLog,
  BotPerformanceHistory,
  TimeSeriesDataPoint,
} from '@/services/projectService';
import { projectService } from '@/services/projectService';
import websocketService, { WebSocketEvents } from '@/services/websocketService';

import { DataChart } from '@/components/ui/data-chart';
import { DataTable, type TableTab } from '@/components/ui/data-table';


type TimePeriod = '24h' | '7d' | '1m';

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
const extractBaseBotName = (fullBotName: string): string => {
  if (!fullBotName) return '';

  // Split by hyphen and return the first part
  // e.g., "SnipeBot-2b68b4a081df1ba11c" becomes "SnipeBot"
  const parts = fullBotName.split('-');
  return parts[0];
};

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
  project?: {
    _id: string;
    botPerformance?: BotPerformanceHistory[];
    recentActivity?: ActivityLog[];
  };
  projectStats?: any;
  ref?: React.Ref<ProjectAnalyticsHandle>;
}

// Convert to forwardRef component to expose methods to parent
export const ProjectAnalytics = forwardRef<
  ProjectAnalyticsHandle,
  ProjectAnalyticsProps
>(({ project, projectStats }, ref ) => {
  const [_volumeTrends, setVolumeTrends] = useState<TimeSeriesDataPoint[]>([]);
  const [_profitTrends, setProfitTrends] = useState<TimeSeriesDataPoint[]>([]);
  const [profitTimePeriod, setProfitTimePeriod] = useState<TimePeriod>('7d');
  const [volumeTimePeriod, setVolumeTimePeriod] = useState<TimePeriod>('7d');
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
    from: subWeeks(new Date(), 1),
    to: new Date(),
  });
  const [activityLogDateRange, setActivityLogDateRange] = useState<
    DateRange | undefined
  >({
    from: subWeeks(new Date(), 1),
    to: new Date(),
  });

  // Bot filter states
  const [selectedBotPerformance, setSelectedBotPerformance] = useState<
    string | null
  >(null);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);

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
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized function to get date range based on time period
  const memoizedGetDateRange = useCallback(
    (period: TimePeriod): { start: Date; end: Date } => {
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
        default:
          start = subDays(end, 1);
      }

      return { start, end };
    },
    []
  );

  // WebSocket integration
  // Memoize the handlers to prevent recreation on re-renders
  const handleBotPerformanceUpdate = useCallback(
    (data: any) => {
      if (data.projectId === projectId && data.botId && data.performance) {
        console.log(`🤖 [ProjectAnalytics] Received bot performance update:`, {
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
        });

        // Update the bot performance data with the new data
        setBotPerformanceData((prev) => {
          // Find if this bot already exists in our data
          const botIndex = prev.findIndex((bot) => bot.botId === data.botId);

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
            lastUpdated: new Date().toISOString(),
          };

          // Check if within current date range
          const inRange =
            botPerformanceDateRange?.from && botPerformanceDateRange?.to
              ? isWithinInterval(new Date(), {
                  start: botPerformanceDateRange.from,
                  end: getEndOfDay(botPerformanceDateRange.to),
                })
              : true;

          if (!inRange) {
            console.log(
              '🤖 [ProjectAnalytics] Bot performance update outside current date range:',
              {
                botId: data.botId,
                dateRange: {
                  from: botPerformanceDateRange?.from?.toISOString(),
                  to: botPerformanceDateRange?.to?.toISOString(),
                },
                updateTime: new Date().toISOString(),
              }
            );
          }

          let updatedData;
          if (botIndex >= 0) {
            // Update existing bot data
            const updatedBots = [...prev];
            updatedBots[botIndex] = {
              ...updatedBots[botIndex],
              ...newPerformanceData,
            };
            updatedData = updatedBots;
            console.log(
              '🤖 [ProjectAnalytics] Updated existing bot performance:',
              {
                botId: data.botId,
                oldData: prev[botIndex],
                newData: updatedBots[botIndex],
                timestamp: new Date().toISOString(),
              }
            );
          } else {
            // Add new bot data
            updatedData = [...prev, newPerformanceData];
            console.log('🤖 [ProjectAnalytics] Added new bot performance:', {
              botId: data.botId,
              newData: newPerformanceData,
              timestamp: new Date().toISOString(),
            });
          }
          return updatedData.sort(
            (a, b) =>
              new Date(b.lastUpdated || b.date).getTime() -
              new Date(a.lastUpdated || a.date).getTime()
          );
        });

        // If this update matches our filter, show a toast notification
        const botMatches =
          !selectedBotPerformance ||
          selectedBotPerformance === data.performance.botName ||
          selectedBotPerformance === `Bot-${data.botId.substring(0, 8)}`;

        if (botMatches) {
          console.log(
            `🤖 [ProjectAnalytics] Bot performance update matches current filter:`,
            {
              botId: data.botId,
              botName:
                data.performance.botName || `Bot-${data.botId.substring(0, 8)}`,
              selectedBot: selectedBotPerformance,
              timestamp: new Date().toISOString(),
            }
          );
        }
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
    [
      projectId,
      botPerformanceDateRange,
      selectedBotPerformance,
      botPerformanceData.length,
    ]
  );

  // Handle activity log updates with enhanced logging
  const handleActivityLogUpdate = useCallback(
    (data: any) => {
      if (data.projectId === projectId && data.activity) {
        console.log(`📝 [ProjectAnalytics] Received activity update:`, {
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
        };

        // Check if activity is within the current date range filter
        const inRange =
          activityLogDateRange?.from && activityLogDateRange?.to
            ? isWithinInterval(new Date(normalizedActivity.timestamp), {
                start: activityLogDateRange.from,
                end: getEndOfDay(activityLogDateRange.to),
              })
            : true;

        // Check if activity matches the current bot filter
        const botMatches =
          !selectedBot || selectedBot === normalizedActivity.botName;

        if (!inRange) {
          console.log(
            '📝 [ProjectAnalytics] Activity outside current date range:',
            {
              activity: normalizedActivity,
              dateRange: {
                from: activityLogDateRange?.from?.toISOString(),
                to: activityLogDateRange?.to?.toISOString(),
              },
              timestamp: new Date().toISOString(),
            }
          );
        }

        if (!botMatches) {
          console.log(
            '📝 [ProjectAnalytics] Activity does not match current bot filter:',
            {
              activityBot: normalizedActivity.botName,
              selectedBot,
              timestamp: new Date().toISOString(),
            }
          );
        }

        // Always update the data regardless of filters to keep it complete
        setActivityLogData((prev) => {
          const updated = [normalizedActivity, ...prev].slice(0, 100);
          console.log('📝 [ProjectAnalytics] Updated activity log:', {
            newActivity: normalizedActivity,
            totalActivities: updated.length,
            timestamp: new Date().toISOString(),
          });
          return updated;
        });

        // Show toast notification if the activity matches current filters
        if (inRange && botMatches) {
          console.log(
            `📝 [ProjectAnalytics] Activity update matches current filters:`,
            {
              activity: normalizedActivity,
              timestamp: new Date().toISOString(),
            }
          );
        }
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
    [projectId, activityLogDateRange, selectedBot, activityLogData.length]
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
          setProfitTrends((prev) => {
            // Check if datapoint is in the current time period
            const { start, end } = memoizedGetDateRange(profitTimePeriod);
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
          setVolumeTrends((prev) => {
            // Check if datapoint is in the current time period
            const { start, end } = memoizedGetDateRange(volumeTimePeriod);
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
    [
      projectId,
      profitTimePeriod,
      volumeTimePeriod,
      memoizedGetDateRange,
      dispatch,
    ]
  );

  useEffect(() => {
    if (!projectId) return;

    console.log(`🔌 Setting up WebSocket handlers for project ${projectId}`);

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

    // Cleanup on unmount
    return () => {
      console.log(`🔌 Cleaning up WebSocket handlers for project ${projectId}`);
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
      websocketService.leaveProject(projectId);
    };
  }, [
    projectId,
    handleBotPerformanceUpdate,
    handleActivityLogUpdate,
    handleTimeSeriesUpdate,
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
                end: getEndOfDay(botPerformanceDateRange.to),
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
                end: getEndOfDay(activityLogDateRange.to),
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
                memoizedGetDateRange(profitTimePeriod)
              ),
              projectService.getVolumeTrending(
                projectId,
                memoizedGetDateRange(volumeTimePeriod)
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
    [projectId, profitTimePeriod, volumeTimePeriod, memoizedGetDateRange]
  );

  // Single effect to handle both trending data fetches
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrendingData();
    }, 100);

    return () => clearTimeout(timer);
  }, [fetchTrendingData]);

  const filterOption = useMemo(() => (
    { 
      key: { label: "Bot Name", value: "botName"}, 
      options: ["All", "VolumeBot", "AutoSellBot", "SnipeBot", "HolderBot"] 
    }), []);

  console.log(`\n =============== table 1 data ===============\n${JSON.stringify(filteredBotPerformanceData, null, 2)}`)
  console.log(`\n =============== table 2 data ===============\n${JSON.stringify(filteredActivityLogData, null, 2)}`)


  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <DataChart
          title="Profit Trend"
          description="Trading profit"
          data={filteredBotPerformanceData}
          yKey="profit"
          xKey="date"
          color="hsl(var(--chart-1))"
          isLoading={isLoadingBotPerformance}
          showDateRange={true}
          showDateButtons={true} 
          showChartTypeSelector={false}
          showHeaderInVertical={true}
          dateRange={botPerformanceDateRange}
          onDateRangeChange={setBotPerformanceDateRange}
        />

        <DataChart
          title="Trading Volume Trend"
          description="Trading volume"
          data={filteredActivityLogData}
          yKey="volume"
          xKey="timestamp"
          color="hsl(var(--chart-1))"
          isLoading={isLoadingActivity}
          showDateRange={true}
          showDateButtons={true} 
          showChartTypeSelector={false}
          showHeaderInVertical={true}
          dateRange={activityLogDateRange}
          onDateRangeChange={setActivityLogDateRange}
        />
      </div>

      <DataTable
        title="Bot Performance"
        description=""
        data={filteredBotPerformanceData}
        showColumns={[
          { name: 'botName', type: 'normal'},
          { name: 'action', type: 'normal' },
          { name: 'trades', type: 'normal'},
          { name: 'profit', type: 'price', displayName: 'Profit Contribution' },
          { name: 'date', type: 'time', displayName: 'Time' },
        ]}
        filterOption={ filterOption }
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
        data={filteredActivityLogData}
        showColumns={[
          { name: 'botName', type: 'normal' },
          { name: 'action', type: 'normal' },
          { name: 'volume', type: 'price' },
          { name: 'impact', type: 'percent' },
          { name: 'timestamp', type: 'time' },
        ]}
        filterOption={ filterOption }
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
