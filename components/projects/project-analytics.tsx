"use client"

import { useState, useEffect, useMemo } from "react"
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

type TimePeriod = "24h" | "7d" | "1m" | "1y"

export function ProjectAnalytics({ project, trends, botPerformance, recentActivity }: ProjectAnalyticsProps) {
  const [profitTimePeriod, setProfitTimePeriod] = useState<TimePeriod>("24h")
  const [volumeTimePeriod, setVolumeTimePeriod] = useState<TimePeriod>("24h")
  const { projectStats, loading } = useSelector((state: RootState) => state.projects)
  const dispatch = useDispatch()

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

  // Effect to fetch bot performance when date range changes
  useEffect(() => {
    if (project?._id && botPerformanceDateRange?.from && botPerformanceDateRange?.to) {
      dispatch(fetchBotPerformance({
        projectId: project._id,
        startDate: botPerformanceDateRange.from,
        endDate: botPerformanceDateRange.to
      }) as any)
    }
  }, [project?._id, botPerformanceDateRange, dispatch])

  // Effect to fetch activity log when date range changes
  useEffect(() => {
    if (project?._id && activityLogDateRange?.from && activityLogDateRange?.to) {
      dispatch(fetchRecentActivity({
        projectId: project._id,
        limit: 50
      }) as any)
    }
  }, [project?._id, activityLogDateRange, dispatch])

  // Filter bot performance data based on date range and selected bot
  const filteredBotPerformanceData = useMemo(() => {
    const botPerformance = projectStats?.botPerformance as BotPerformanceHistory[] | undefined
    return (botPerformance || []).filter((bot) => {
      // Filter by date range
      const botDate = parseISO(bot.date)
      const matchesDateRange =
        !botPerformanceDateRange ||
        !botPerformanceDateRange.from ||
        !botPerformanceDateRange.to ||
        isWithinInterval(botDate, {
          start: botPerformanceDateRange.from,
          end: botPerformanceDateRange.to,
        })

      // Filter by selected bot
      const matchesBot = !selectedBotPerformance || bot.botId === selectedBotPerformance

      return matchesDateRange && matchesBot
    })
  }, [projectStats?.botPerformance, botPerformanceDateRange, selectedBotPerformance])

  // Filter activity log data based on date range and selected bot
  const filteredActivityLogData = useMemo(() => {
    const recentActivity = projectStats?.recentActivity as ActivityLog[] | undefined
    return (recentActivity || []).filter((activity) => {
      // Filter by date range
      const activityDate = parseISO(activity.timestamp.toString())
      const matchesDateRange =
        !activityLogDateRange ||
        !activityLogDateRange.from ||
        !activityLogDateRange.to ||
        isWithinInterval(activityDate, {
          start: activityLogDateRange.from,
          end: activityLogDateRange.to,
        })

      // Filter by selected bot
      const matchesBot = !selectedBot || activity.botName === selectedBot

      return matchesDateRange && matchesBot
    })
  }, [projectStats?.recentActivity, activityLogDateRange, selectedBot])

  // Get available bots from performance data
  const availableBots = useMemo(() => {
    const botMap = new Map<string, { id: string; name: string }>()
    const botPerformance = projectStats?.botPerformance as BotPerformanceHistory[] | undefined
    botPerformance?.forEach((bot) => {
      if (!botMap.has(bot.botId)) {
        botMap.set(bot.botId, {
          id: bot.botId,
          name: bot.botName
        })
      }
    })
    return Array.from(botMap.values())
  }, [projectStats?.botPerformance])

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

  if (loading) {
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
                <LineChart data={projectStats?.trends?.profitTrend || []}>
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
                <LineChart data={projectStats?.trends?.volumeTrend || []}>
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
                  (bot: BotPerformanceHistory) => (
                    <TableRow key={`${bot.botId}-${bot.date}`}>
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
                      <TableCell>{formatCurrency(bot.profitContribution)}</TableCell>
                      <TableCell>{bot.uptime}</TableCell>
                      <TableCell>{format(new Date(bot.lastUpdated), 'HH:mm:ss')}</TableCell>
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
                    (activity: ActivityLog) => (
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

