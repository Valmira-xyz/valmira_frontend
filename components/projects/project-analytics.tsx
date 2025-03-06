"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatNumber } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { BotFilter } from "@/components/projects/bot-filter"
import type { DateRange } from "react-day-picker"
import { format, isWithinInterval, parseISO, subDays } from "date-fns"
import { Download, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible"

type TimePeriod = "24h" | "7d" | "1m" | "1y"

// Mock data for charts and tables
const profitData = {
  "24h": [
    { date: "00:00", profit: 1000 },
    { date: "06:00", profit: 1200 },
    { date: "12:00", profit: 1100 },
    { date: "18:00", profit: 1300 },
    { date: "23:59", profit: 1500 },
  ],
  "7d": [
    { date: "Mon", profit: 5000 },
    { date: "Tue", profit: 5500 },
    { date: "Wed", profit: 5200 },
    { date: "Thu", profit: 6000 },
    { date: "Fri", profit: 6500 },
    { date: "Sat", profit: 6300 },
    { date: "Sun", profit: 6800 },
  ],
  "1m": [
    { date: "Week 1", profit: 20000 },
    { date: "Week 2", profit: 22000 },
    { date: "Week 3", profit: 21500 },
    { date: "Week 4", profit: 23000 },
  ],
  "1y": [
    { date: "Jan", profit: 100000 },
    { date: "Feb", profit: 110000 },
    { date: "Mar", profit: 105000 },
    { date: "Apr", profit: 115000 },
    { date: "May", profit: 120000 },
    { date: "Jun", profit: 118000 },
    { date: "Jul", profit: 125000 },
    { date: "Aug", profit: 130000 },
    { date: "Sep", profit: 135000 },
    { date: "Oct", profit: 140000 },
    { date: "Nov", profit: 145000 },
    { date: "Dec", profit: 150000 },
  ],
}

const volumeData = {
  "24h": [
    { date: "00:00", volume: 5000 },
    { date: "06:00", volume: 5500 },
    { date: "12:00", volume: 5200 },
    { date: "18:00", volume: 6000 },
    { date: "23:59", volume: 6500 },
  ],
  "7d": [
    { date: "Mon", volume: 25000 },
    { date: "Tue", volume: 27500 },
    { date: "Wed", volume: 26000 },
    { date: "Thu", volume: 30000 },
    { date: "Fri", volume: 32500 },
    { date: "Sat", volume: 31500 },
    { date: "Sun", volume: 34000 },
  ],
  "1m": [
    { date: "Week 1", volume: 100000 },
    { date: "Week 2", volume: 110000 },
    { date: "Week 3", volume: 107500 },
    { date: "Week 4", volume: 115000 },
  ],
  "1y": [
    { date: "Jan", volume: 500000 },
    { date: "Feb", volume: 550000 },
    { date: "Mar", volume: 525000 },
    { date: "Apr", volume: 575000 },
    { date: "May", volume: 600000 },
    { date: "Jun", volume: 590000 },
    { date: "Jul", volume: 625000 },
    { date: "Aug", volume: 650000 },
    { date: "Sep", volume: 675000 },
    { date: "Oct", volume: 700000 },
    { date: "Nov", volume: 725000 },
    { date: "Dec", volume: 750000 },
  ],
}

// Extended bot performance data with dates
const botPerformanceData = [
  { id: "1", name: "Liquidation Bot", status: "Active", trades: 150, profit: 500, uptime: "99.9%", date: "2023-01-05" },
  { id: "1", name: "Liquidation Bot", status: "Active", trades: 145, profit: 480, uptime: "99.8%", date: "2023-01-04" },
  { id: "1", name: "Liquidation Bot", status: "Active", trades: 155, profit: 520, uptime: "99.9%", date: "2023-01-03" },
  { id: "2", name: "Volume Bot", status: "Active", trades: 120, profit: 450, uptime: "99.7%", date: "2023-01-05" },
  { id: "2", name: "Volume Bot", status: "Active", trades: 115, profit: 430, uptime: "99.6%", date: "2023-01-04" },
  { id: "2", name: "Volume Bot", status: "Active", trades: 125, profit: 470, uptime: "99.8%", date: "2023-01-03" },
  { id: "3", name: "Holder Bot", status: "Active", trades: 95, profit: 380, uptime: "99.5%", date: "2023-01-05" },
  { id: "3", name: "Holder Bot", status: "Active", trades: 90, profit: 360, uptime: "99.4%", date: "2023-01-04" },
  { id: "3", name: "Holder Bot", status: "Active", trades: 100, profit: 400, uptime: "99.6%", date: "2023-01-03" },
]

// Extended recent activity data with dates and bot IDs
const recentActivityData = [
  {
    timestamp: "2023-01-05 14:30",
    botId: "1",
    botName: "Liquidation Bot",
    action: "Add LP",
    volume: 100,
    impact: "+0.5%",
  },
  { timestamp: "2023-01-05 14:15", botId: "2", botName: "Volume Bot", action: "Sell", volume: 80, impact: "-0.3%" },
  { timestamp: "2023-01-05 13:45", botId: "3", botName: "Holder Bot", action: "Hold", volume: 200, impact: "0%" },
  {
    timestamp: "2023-01-04 16:20",
    botId: "1",
    botName: "Liquidation Bot",
    action: "Buy",
    volume: 150,
    impact: "+0.7%",
  },
  { timestamp: "2023-01-04 15:10", botId: "2", botName: "Volume Bot", action: "Sell", volume: 120, impact: "-0.5%" },
  { timestamp: "2023-01-04 14:30", botId: "3", botName: "Holder Bot", action: "Hold", volume: 180, impact: "0%" },
  {
    timestamp: "2023-01-03 17:45",
    botId: "1",
    botName: "Liquidation Bot",
    action: "Add LP",
    volume: 90,
    impact: "+0.4%",
  },
  { timestamp: "2023-01-03 16:30", botId: "2", botName: "Volume Bot", action: "Buy", volume: 110, impact: "+0.6%" },
  { timestamp: "2023-01-03 15:15", botId: "3", botName: "Holder Bot", action: "Hold", volume: 170, impact: "0%" },
]

// List of available bots for filtering
const availableBots = [
  { id: "1", name: "Liquidation Bot" },
  { id: "2", name: "Volume Bot" },
  { id: "3", name: "Holder Bot" },
]

interface ProjectAnalyticsProps {
  project?: any
}

export function ProjectAnalytics({ project }: ProjectAnalyticsProps) {
  const [profitTimePeriod, setProfitTimePeriod] = useState<TimePeriod>("24h")
  const [volumeTimePeriod, setVolumeTimePeriod] = useState<TimePeriod>("24h")

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

  // Filter bot performance data based on date range and selected bot
  const filteredBotPerformanceData = botPerformanceData.filter((bot) => {
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
    const matchesBot = !selectedBotPerformance || bot.id === selectedBotPerformance

    return matchesDateRange && matchesBot
  })

  // Filter activity log data based on date range and selected bot
  const filteredActivityLogData = recentActivityData.filter((activity) => {
    // Filter by date range
    const activityDate = parseISO(activity.timestamp.split(" ")[0])
    const matchesDateRange =
      !activityLogDateRange ||
      !activityLogDateRange.from ||
      !activityLogDateRange.to ||
      isWithinInterval(activityDate, {
        start: activityLogDateRange.from,
        end: activityLogDateRange.to,
      })

    // Filter by selected bot
    const matchesBot = !selectedBot || activity.botId === selectedBot

    return matchesDateRange && matchesBot
  })

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

  if (!project) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TimePeriodButtons currentPeriod={profitTimePeriod} onChange={setProfitTimePeriod} />
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitData[profitTimePeriod]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`$${formatNumber(Number(value))}`, "Profit"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line type="monotone" dataKey="profit" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trading Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TimePeriodButtons currentPeriod={volumeTimePeriod} onChange={setVolumeTimePeriod} />
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={volumeData[volumeTimePeriod]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`$${formatNumber(Number(value))}`, "Volume"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line type="monotone" dataKey="volume" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
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
                  console.log("Bot Performance date range changed:", range)
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
                    <TableRow key={`${bot.id}-${bot.date}-${index}`}>
                      <TableCell>{bot.name}</TableCell>
                      <TableCell>{bot.status}</TableCell>
                      <TableCell>{bot.trades}</TableCell>
                      <TableCell>${formatNumber(bot.profit)}</TableCell>
                      <TableCell>{bot.uptime}</TableCell>
                      <TableCell>{format(parseISO(bot.date), "MMM dd, yyyy")}</TableCell>
                    </TableRow>
                  ),
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
                {filteredBotPerformanceData.length > 10 && (
                  <Button variant="outline" size="sm">
                    Load More
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Collapsible>

      <Collapsible open={isActivityLogExpanded} onOpenChange={setActivityLogExpanded} className="w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity Log</CardTitle>
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
                  console.log("Activity Log date range changed:", range)
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Bot Name</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isActivityLogExpanded ? filteredActivityLogData : filteredActivityLogData.slice(0, 3)).map(
                  (activity, index) => (
                    <TableRow key={index}>
                      <TableCell>{activity.timestamp}</TableCell>
                      <TableCell>{activity.botName}</TableCell>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>{formatNumber(activity.volume)}</TableCell>
                      <TableCell>{activity.impact}</TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
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
                {filteredActivityLogData.length > 10 && (
                  <Button variant="outline" size="sm">
                    Load More
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Collapsible>
    </div>
  )
}

