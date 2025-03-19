"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatNumber, formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { BotFilter } from "@/components/projects/bot-filter"
import type { DateRange } from "react-day-picker"
import { format, isWithinInterval, parseISO, subDays } from "date-fns"
import { Download, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProjectAnalyticsProps } from "@/types"
import { useSelector, useDispatch } from "react-redux"
import { fetchBotPerformance, fetchRecentActivity } from "@/store/slices/projectSlice"
import { RootState } from "@/store/store"
import type { BotPerformanceHistory, ActivityLog, ProjectStatistics } from "@/services/projectService"
import { useParams } from "next/navigation"

type TimePeriod = "24h" | "7d" | "1m" | "1y"

// Utility function to format milliseconds to a readable duration
const formatUptime = (ms: number): string => {
  if (isNaN(ms) || ms <= 0) return "0s";
  
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

export function ProjectAnalytics({ project, trends, botPerformance, recentActivity }: ProjectAnalyticsProps) {
  const [profitTimePeriod, setProfitTimePeriod] = useState<TimePeriod>("24h")
  const [volumeTimePeriod, setVolumeTimePeriod] = useState<TimePeriod>("24h")
  const { projectStats, loading } = useSelector((state: RootState) => state.projects)
  const dispatch = useDispatch()
  //let's fetch project id from url e.g http://localhost:3008/projects/67d27b2b68b4a081df1ba11b
  const { id: projectId } = useParams() as { id: string }  



  // Refs to prevent duplicate API calls
  const botPerformanceFetchInProgress = useRef(false)
  const recentActivityFetchInProgress = useRef(false)
  const initialRenderComplete = useRef(false)
  const lastBotPerformanceFetchParams = useRef<{
    projectId: string | undefined,
    startDate: Date | undefined,
    endDate: Date | undefined
  }>({
    projectId: undefined,
    startDate: undefined,
    endDate: undefined
  })
  const lastActivityFetchParams = useRef<{
    projectId: string | undefined,
    limit: number | undefined
  }>({
    projectId: undefined,
    limit: undefined
  })

  // Date range state for bot performance
  const [botPerformanceDateRange, setBotPerformanceDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  // Date range state for activity log
  const [activityLogDateRange, setActivityLogDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  // Bot filter state for bot performance
  const [selectedBotPerformance, setSelectedBotPerformance] = useState<string | null>(null)

  // Bot filter state for activity log
  const [selectedBot, setSelectedBot] = useState<string | null>(null)

  // Expanded state for sections
  const [isBotPerformanceExpanded, setBotPerformanceExpanded] = useState(false)
  const [isActivityLogExpanded, setActivityLogExpanded] = useState(false)

  // Create memoized fetch functions to prevent duplicate calls
  const fetchBotPerformanceData = useCallback(async () => {
    if (!project?._id && !projectId || !botPerformanceDateRange?.from || !botPerformanceDateRange?.to) {
      console.log("⚠️ Skipping fetchBotPerformanceData - missing required data:", {
        projectId: project?._id || projectId,
        from: botPerformanceDateRange?.from,
        to: botPerformanceDateRange?.to
      });
      return;
    }
    
    const newParams = {
      projectId: project?._id || projectId,
      startDate: botPerformanceDateRange.from,
      endDate: botPerformanceDateRange.to
    }
    
    // Skip if fetch is already in progress or if params haven't changed
    if (botPerformanceFetchInProgress.current) {
      return;
    }
    
    const paramsUnchanged = 
      lastBotPerformanceFetchParams.current.projectId === newParams.projectId &&
      lastBotPerformanceFetchParams.current.startDate?.getTime() === newParams.startDate?.getTime() &&
      lastBotPerformanceFetchParams.current.endDate?.getTime() === newParams.endDate?.getTime()
      
    if (paramsUnchanged) {
      return;
    }
    
    try {
      botPerformanceFetchInProgress.current = true
      lastBotPerformanceFetchParams.current = newParams
      
      await dispatch(fetchBotPerformance({
        projectId: project?._id || projectId,
        startDate: botPerformanceDateRange.from,
        endDate: botPerformanceDateRange.to
      }) as any);
      
    } catch (error) {
      console.error("❌ fetchBotPerformanceData failed:", error);
    } finally {
      botPerformanceFetchInProgress.current = false
    }
  }, [project?._id, projectId, botPerformanceDateRange, dispatch])

  // Fetch activity log data with debounce
  const fetchActivityLogData = useCallback(async () => {
    if (!project?._id && !projectId) {
      return;
    }
    
    const newParams = {
      projectId: project?._id || projectId,
      limit: 50
    }
    
    // Skip if fetch is already in progress or if params haven't changed
    if (recentActivityFetchInProgress.current) {
      return;
    }
    
    const paramsUnchanged = 
      lastActivityFetchParams.current.projectId === newParams.projectId &&
      lastActivityFetchParams.current.limit === newParams.limit
      
    if (paramsUnchanged) {
      return;
    }
    
    try {
      recentActivityFetchInProgress.current = true
      lastActivityFetchParams.current = newParams
      
      await dispatch(fetchRecentActivity({
        projectId: project?._id || projectId,
        limit: 50
      }) as any);
      
    } catch (error) {
      console.error("❌ fetchActivityLogData failed:", error);
    } finally {
      recentActivityFetchInProgress.current = false
    }
  }, [project?._id, projectId, dispatch])

  // Effect to fetch bot performance when date range changes
  useEffect(() => {
    // If we already have data from props, don't fetch immediately
    const shouldDelayFetch = botPerformance && botPerformance.length > 0;
    
    const timer = setTimeout(() => {
      fetchBotPerformanceData();
    }, shouldDelayFetch ? 1000 : 100); // Longer delay if we already have data
    
    return () => clearTimeout(timer);
  }, [fetchBotPerformanceData, botPerformance]);

  
  // Effect to fetch activity log when date range changes
  useEffect(() => {
    // If we already have data from props, don't fetch immediately
    const shouldDelayFetch = recentActivity && recentActivity.length > 0;
    
    const timer = setTimeout(() => {
      fetchActivityLogData();
    }, shouldDelayFetch ? 1000 : 100); // Longer delay if we already have data
    
    return () => clearTimeout(timer);
  }, [fetchActivityLogData, recentActivity]);

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

  // Filter bot performance data based on date range and selected bot
  const filteredBotPerformanceData = useMemo(() => {
    // Define a type for the standardized bot performance data
    type StandardizedBotPerformance = {
      botId: string;
      botName: string;
      status: string;
      trades: number;
      profit: number;
      uptime: string;
      date: string;
      profitContribution: number;
      lastUpdated: string;
    };
    
    // First use the props data if available, then fall back to redux store data
    let performanceData: StandardizedBotPerformance[] = [];
        
    if (botPerformance && botPerformance.length > 0) {
      // Props data (BotPerformance type)
      performanceData = botPerformance.map(bot => {
        // Safely handle date values - use current time as a fallback
        const now = new Date().toISOString();
        
        return {
          // Use bot ID if available, otherwise use botName
          botId: (bot as any).botId || bot.botName || `bot-${Math.random().toString(36).substring(2, 9)}`,
          botName: bot.botName,
          status: bot.status,
          trades: bot.trades || 0,
          profit: (bot as any).profit || bot.profitContribution || 0,
          uptime: formatUptime(typeof bot.uptime === 'number' ? bot.uptime : parseInt(String(bot.uptime || '0')) || 0),
          // Always ensure we have valid date strings - use current time as fallback
          date: now,
          profitContribution: bot.profitContribution || (bot as any).profit || 0,
          lastUpdated: now
        };
      });
    } else if (projectStats?.botPerformance && projectStats.botPerformance.length > 0) {
      // Redux data (BotPerformanceHistory type)
      performanceData = projectStats.botPerformance.map(bot => {
        // Handle differently structured data from Redux
        // Ensure all fields are present and valid
        const now = new Date().toISOString();
        
        return {
          botId: bot.botId || bot.botName || `bot-${Math.random().toString(36).substring(2, 9)}`,
          botName: bot.botName,
          status: bot.status,
          trades: bot.trades || 0,
          profit: bot.profit || 0,
          uptime: formatUptime(typeof bot.uptime === 'number' ? bot.uptime : parseInt(String(bot.uptime || '0')) || 0),
          // Format date properly or use current time as fallback
          date: bot.date ? new Date(bot.date).toISOString() : now,
          profitContribution: bot.profit || 0,
          lastUpdated: now
        };
      });
    }
    
    // Add debug logging for date ranges
    if (performanceData.length > 0 && botPerformanceDateRange?.from && botPerformanceDateRange?.to) {
      try {
        // Safely check date format for debugging
        let isoFormatValue = 'not a string';
        if (typeof performanceData[0].date === 'string') {
          const testDate = new Date(performanceData[0].date);
          // Check if date is valid before calling toISOString
          if (!isNaN(testDate.getTime())) {
            isoFormatValue = testDate.toISOString();
          } else {
            isoFormatValue = 'invalid date string';
          }
        }
        
      } catch (error) {
        console.error("Error in debug logging:", error);
      }
    }
    
    // TEMPORARY: Return all performance data without filtering to debug display issues
    return performanceData;
    
  }, [botPerformance, projectStats?.botPerformance, botPerformanceDateRange, selectedBotPerformance]);

  // Filter activity log data based on date range and selected bot
  const filteredActivityLogData = useMemo(() => {
    // Define a type for the standardized activity log data
    type StandardizedActivityLog = {
      botName: string;
      timestamp: string;
      action: string;
      volume: number;
      impact: number;
      [key: string]: any; // Allow for additional properties
    };
    
    // First use the props data if available, then fall back to redux store data
    let activityData: StandardizedActivityLog[] = [];
    
    
    if (recentActivity && recentActivity.length > 0) {
      // Props data - make sure to standardize the format
      activityData = recentActivity.map(activity => {
        // Ensure all required fields exist with sensible defaults
        const now = new Date().toISOString();
        
        return {
          ...activity,
          // Ensure botName is always present
          botName: activity.botName || "Unknown Bot",
          // Ensure timestamp is always a valid date string
          timestamp: isValidDate(activity.timestamp) 
            ? toSafeDate(activity.timestamp)!.toISOString() 
            : now,
          // Ensure numeric fields have valid defaults
          volume: activity.volume || 0,
          impact: activity.impact || 0,
          // Ensure action is present
          action: activity.action || "Unknown Action"
        };
      });
    } else if (projectStats?.recentActivity && projectStats.recentActivity.length > 0) {
      // Redux data - make sure to standardize the format
      activityData = projectStats.recentActivity.map(activity => {
        // Ensure all required fields exist with sensible defaults
        const now = new Date().toISOString();
        
        return {
          ...activity,
          // Ensure botName is always present
          botName: activity.botName || "Unknown Bot",
          // Ensure timestamp is always a valid date string
          timestamp: isValidDate(activity.timestamp) 
            ? toSafeDate(activity.timestamp)!.toISOString() 
            : now,
          // Ensure numeric fields have valid defaults
          volume: activity.volume || 0,
          impact: activity.impact || 0,
          // Ensure action is present
          action: activity.action || "Unknown Action"
        };
      });
    }
    
    // Add debug logging for date ranges
    if (activityData.length > 0 && activityLogDateRange?.from && activityLogDateRange?.to) {
      try {
        // Safely format timestamp for debugging
        const timestamp = activityData[0].timestamp;
        const timestampType = typeof timestamp;
        
        // Simplified timestamp validation to avoid type errors
        let formattedTimestamp = 'unavailable';
        try {
          // Try to create a date object and convert to ISO string
          const testDate = new Date(timestamp as any);
          formattedTimestamp = !isNaN(testDate.getTime()) 
            ? testDate.toISOString() 
            : 'invalid timestamp';
        } catch (error) {
          formattedTimestamp = 'error parsing timestamp';
        }
        
        console.log("Activity Data after mapping:", activityData);
        console.log("Filtering activity log with date range:", {
          from: activityLogDateRange.from,
          to: activityLogDateRange.to,
          sampleTimestamp: timestamp,
          type: timestampType,
          formatted: formattedTimestamp
        });
      } catch (error) {
        console.error("Error in activity log debug logging:", error);
      }
    }
    
    // TEMPORARY: Return all activity data without filtering to debug display issues
    return activityData;

  }, [recentActivity, projectStats?.recentActivity, activityLogDateRange, selectedBot]);

  // Get available bots from performance data - optimized for rendering speed
  const initialAvailableBots = useMemo(() => {
    // For initial render, just use the props data without waiting for Redux
    if (botPerformance && botPerformance.length > 0) {
      const botMap = new Map<string, { id: string; name: string }>();
      
      botPerformance.forEach((bot) => {
        if (!botMap.has(bot.botName)) {
          botMap.set(bot.botName, {
            id: bot.botName,
            name: bot.botName
          });
        }
      });
      
      return Array.from(botMap.values());
    }
    
    return [];
  }, [botPerformance]); // Only depends on props
  
  // Full available bots calculation that includes Redux data
  const availableBots = useMemo(() => {
    // Start with the initial bots from props
    const botMap = new Map<string, { id: string; name: string }>();
    
    // Add initial bots from props first
    initialAvailableBots.forEach(bot => {
      if (!botMap.has(bot.id)) {
        botMap.set(bot.id, bot);
      }
    });
    
    // Then add any additional bots from Redux store
    const storePerformance = projectStats?.botPerformance as BotPerformanceHistory[] | undefined;
    storePerformance?.forEach((bot) => {
      if (!botMap.has(bot.botId)) {
        botMap.set(bot.botId, {
          id: bot.botId,
          name: bot.botName
        });
      }
    });
    
    // If we still have no bots and there's recentActivity data, extract bot names from there
    if (botMap.size === 0 && recentActivity && recentActivity.length > 0) {
      recentActivity.forEach(activity => {
        if (activity.botName && !botMap.has(activity.botName)) {
          botMap.set(activity.botName, {
            id: activity.botName,
            name: activity.botName
          });
        }
      });
    }
    
    return Array.from(botMap.values());
  }, [initialAvailableBots, projectStats?.botPerformance, recentActivity]);
   

  const TimePeriodButtons = ({
    currentPeriod,
    onChange,
  }: { currentPeriod: TimePeriod; onChange: (period: TimePeriod) => void }) => (
    <div className="flex justify-start space-x-2 mb-4">
      {(["24h", "7d", "1m", "1y"] as TimePeriod[]).map((period) => (
        <Button
          key={period}
          variant={currentPeriod === period ? "default" : "outline"}
          onClick={() => onChange(period)}
        >
          {period}
        </Button>
      ))}
    </div>
  )

  // Function to export data as CSV
  const exportToCSV = (data: any[], filename: string) => {
    // Check if data is empty
    if (!data || !data.length || !data[0]) {
      console.warn("No data to export")
      return
    }

    try {
      // Convert data to CSV format
      const headers = Object.keys(data[0]).join(",")
      const rows = data.map((item) => Object.values(item).join(","))
      const csv = [headers, ...rows].join("\n")

      // Create a blob and download link
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting CSV:", error)
    }
  }

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd HH:mm')
  }

  // Memoized chart data to prioritize props data over redux data
  const chartData = useMemo(() => {
    return {
      profitTrend: (trends?.profitTrend && trends.profitTrend.length > 0) 
        ? trends.profitTrend 
        : (projectStats?.trends?.profitTrend || []),
      volumeTrend: (trends?.volumeTrend && trends.volumeTrend.length > 0)
        ? trends.volumeTrend
        : (projectStats?.trends?.volumeTrend || [])
    };
  }, [trends, projectStats?.trends]);

  // Modified loading check that shows content if props data is available
  const isLoading = useMemo(() => {
    // If we have props data, don't show loading state even if Redux is loading
    const hasPropsData = 
      (botPerformance && botPerformance.length > 0) || 
      (recentActivity && recentActivity.length > 0) ||
      (trends && (trends.profitTrend?.length > 0 || trends.volumeTrend?.length > 0));
    
    // Or if we have Redux data
    const hasReduxData = 
      (projectStats?.botPerformance && projectStats.botPerformance.length > 0) ||
      (projectStats?.recentActivity && projectStats.recentActivity.length > 0) ||
      (projectStats?.trends && (
        (projectStats.trends.profitTrend && projectStats.trends.profitTrend.length > 0) || 
        (projectStats.trends.volumeTrend && projectStats.trends.volumeTrend.length > 0))
      );
    
    // Check if we have filtered data
    const hasFilteredData = 
      filteredBotPerformanceData.length > 0 || 
      filteredActivityLogData.length > 0;
    
    // Only show loading if Redux is loading AND we don't have any data to show
    return loading && !hasPropsData && !hasReduxData && !hasFilteredData;
  }, [
    loading, 
    botPerformance, recentActivity, trends, 
    projectStats?.botPerformance, projectStats?.recentActivity, projectStats?.trends,
    filteredBotPerformanceData, filteredActivityLogData
  ]);



  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
            <CardDescription>24-hour profit performance</CardDescription>
          </CardHeader>
          <CardContent>
            <TimePeriodButtons currentPeriod={profitTimePeriod} onChange={setProfitTimePeriod} />
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.profitTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    labelFormatter={(label) => formatDate(label as number)}
                    formatter={(value: any) => [formatCurrency(value as number), 'Profit']}
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
            <CardDescription>24-hour trading volume</CardDescription>
          </CardHeader>
          <CardContent>
            <TimePeriodButtons currentPeriod={volumeTimePeriod} onChange={setVolumeTimePeriod} />
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.volumeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    labelFormatter={(label) => formatDate(label as number)}
                    formatter={(value: any) => [formatCurrency(value as number), 'Volume']}
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

      <Collapsible open={isBotPerformanceExpanded} onOpenChange={setBotPerformanceExpanded} className="w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bot Performance</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <BotFilter
                bots={availableBots}
                selectedBot={selectedBotPerformance}
                onSelectBot={setSelectedBotPerformance}
                className="min-w-[150px]"
              />
              <DateRangePicker
                dateRange={botPerformanceDateRange}
                onDateRangeChange={(range) => {
                  setBotPerformanceDateRange(range)
                }}
                className="min-w-[240px]"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportToCSV(filteredBotPerformanceData, "bot-performance.csv")}>
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isBotPerformanceExpanded ? "Show Less" : "Show More"}
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${isBotPerformanceExpanded ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bot Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trades</TableHead>
                  <TableHead>Profit Contribution</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isBotPerformanceExpanded ? filteredBotPerformanceData : filteredBotPerformanceData.slice(0, 3)).map(
                  (bot, index) => (
                    <TableRow key={index}>
                      <TableCell>{bot.botName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            bot.status === 'Active' ? 'default' :
                            bot.status === 'Inactive' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {bot.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{bot.trades}</TableCell>
                      <TableCell>{formatCurrency(bot.profit)}</TableCell>
                      <TableCell>{bot.uptime}</TableCell>
                      <TableCell>{format(new Date(bot?.lastUpdated || bot?.date), 'HH:mm:ss')}</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
            {isBotPerformanceExpanded && (
              <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {filteredBotPerformanceData.length} results found
                  {botPerformanceDateRange?.from && botPerformanceDateRange?.to && (
                    <>
                      {" "}
                      from {format(botPerformanceDateRange.from, "MMM dd, yyyy")} to{" "}
                      {format(botPerformanceDateRange.to, "MMM dd, yyyy")}
                    </>
                  )}
                  {selectedBotPerformance && (
                    <> for {availableBots.find((bot) => bot.id === selectedBotPerformance)?.name}</>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </Collapsible>

      <Collapsible open={isActivityLogExpanded} onOpenChange={setActivityLogExpanded} className="w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <BotFilter
                bots={availableBots}
                selectedBot={selectedBot}
                onSelectBot={setSelectedBot}
                className="min-w-[150px]"
              />
              <DateRangePicker
                dateRange={activityLogDateRange}
                onDateRangeChange={(range) => {
                  setActivityLogDateRange(range)
                }}
                className="min-w-[240px]"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportToCSV(filteredActivityLogData, "activity-log.csv")}>
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isActivityLogExpanded ? "Show Less" : "Show More"}
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${isActivityLogExpanded ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Bot</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isActivityLogExpanded ? filteredActivityLogData : filteredActivityLogData.slice(0, 3)).map(
                    (activity) => (
                      <TableRow key={`${activity.timestamp}-${activity.botName}-${activity.action}`}>
                        <TableCell>{format(new Date(activity.timestamp), 'HH:mm:ss')}</TableCell>
                        <TableCell className="font-medium">{activity.botName}</TableCell>
                        <TableCell>{activity.action}</TableCell>
                        <TableCell>{formatCurrency(activity.volume)}</TableCell>
                        <TableCell>
                          <span className={Number(activity.impact) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {Number(activity.impact) >= 0 ? '+' : ''}{Number(activity.impact).toFixed(2)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
            {isActivityLogExpanded && (
              <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {filteredActivityLogData.length} results found
                  {activityLogDateRange?.from && activityLogDateRange?.to && (
                    <>
                      {" "}
                      from {format(activityLogDateRange.from, "MMM dd, yyyy")} to{" "}
                      {format(activityLogDateRange.to, "MMM dd, yyyy")}
                    </>
                  )}
                  {selectedBot && <> for {availableBots.find((bot) => bot.id === selectedBot)?.name}</>}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </Collapsible>
    </div>
  )
}

