"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, DollarSign, BarChart2, Bot, TrendingUp } from "lucide-react"
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { cn, formatNumber } from "@/lib/utils"
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/store/store'
import { fetchProjects, fetchVolumeData } from '@/store/slices/projectSlice'
import { SparklineChart } from "../ui/sparkline-chart"

const useMetrics = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { projects, volumeData } = useSelector((state: RootState) => state.projects)

  useEffect(() => {
    dispatch(fetchProjects())
  }, [dispatch])

  const calculateMetrics = () => {
    const totalProjects = projects.length
    const activeBots = projects.reduce((sum, project) => sum + (project.metrics?.activeBots || 0), 0)
    const volume24h = projects.reduce((sum, project) => sum + (project.metrics?.volume24h || 0), 0)
    const cumulativeProfit = projects.reduce((sum, project) => sum + (project.metrics?.cumulativeProfit || 0), 0)

    // For now, we'll use static chart data structure but with real current values
    return [
      {
        title: "Total Projects",
        value: totalProjects,
        icon: Briefcase,
        chart: [
          { name: "Jan", value: Math.floor(totalProjects * 0.8) },
          { name: "Feb", value: Math.floor(totalProjects * 0.85) },
          { name: "Mar", value: Math.floor(totalProjects * 0.95) },
          { name: "Apr", value: totalProjects },
        ],
      },
      {
        title: "Total Funds Managed",
        value: volume24h * 30, // Estimate of total funds based on 24h volume
        icon: DollarSign,
        chart: [
          { name: "Jan", value: Math.floor(volume24h * 30 * 0.8) },
          { name: "Feb", value: Math.floor(volume24h * 30 * 0.85) },
          { name: "Mar", value: Math.floor(volume24h * 30 * 0.95) },
          { name: "Apr", value: volume24h * 30 },
        ],
      },
      {
        title: "Aggregate Trading Volume",
        value: volume24h,
        icon: BarChart2,
        chart: [
          { name: "Jan", value: Math.floor(volume24h * 0.8) },
          { name: "Feb", value: Math.floor(volume24h * 0.85) },
          { name: "Mar", value: Math.floor(volume24h * 0.95) },
          { name: "Apr", value: volume24h },
        ],
      },
      {
        title: "Active Bots Running",
        value: activeBots,
        icon: Bot,
        chart: [
          { name: "Jan", value: Math.floor(activeBots * 0.8) },
          { name: "Feb", value: Math.floor(activeBots * 0.85) },
          { name: "Mar", value: Math.floor(activeBots * 0.95) },
          { name: "Apr", value: activeBots },
        ],
      },
      {
        title: "Aggregate Profits",
        value: cumulativeProfit,
        icon: TrendingUp,
        chart: [
          { name: "Jan", value: Math.floor(cumulativeProfit * 0.8) },
          { name: "Feb", value: Math.floor(cumulativeProfit * 0.85) },
          { name: "Mar", value: Math.floor(cumulativeProfit * 0.95) },
          { name: "Apr", value: cumulativeProfit },
        ],
      },
    ]
  }

  return calculateMetrics()
}

export function DashboardMetrics() {
  const metrics = useMetrics()
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((metric, index) => (
        <Card key={metric.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold">{metric.title}</CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metric.value)}</div>
            {/* <div className="h-10">
              <SparklineChart data={metric.chart.map(item => item.value)} color={`hsl(var(--chart-${index+1}))`} />
            </div> */}
            <p>+10% from last month</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

