"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, DollarSign, BarChart2, Bot, TrendingUp } from "lucide-react"
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { cn, formatNumber } from "@/lib/utils"
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/store/store'
import { fetchGlobalMetrics, fetchBnbPrice } from '@/store/slices/projectSlice'

export function DashboardMetrics() {
  const dispatch = useDispatch<AppDispatch>()
  const { globalMetrics, loading } = useSelector((state: RootState) => state.projects)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch global metrics data - available without authentication
        await dispatch(fetchGlobalMetrics())
        await dispatch(fetchBnbPrice())
      } catch (error) {
        console.error("Error fetching global metrics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dispatch])

  console.log("globalMetrics : ", globalMetrics);

  // Define metrics based on globalMetrics data
  const metrics = [
    {
      title: "Total Projects",
      value: globalMetrics?.totalProjects?.value || 0,
      trend: globalMetrics?.totalProjects?.trend,
      changePercent: globalMetrics?.totalProjects?.changePercent || 0,
      icon: Briefcase
    },
    {
      title: "Total Funds Managed",
      value: globalMetrics?.totalFundsManaged?.value || 0,
      trend: globalMetrics?.totalFundsManaged?.trend,
      changePercent: globalMetrics?.totalFundsManaged?.changePercent || 0,
      icon: DollarSign
    },
    {
      title: "Trading Volume",
      value: globalMetrics?.aggregateTradingVolume?.value || 0,
      trend: globalMetrics?.aggregateTradingVolume?.trend,
      changePercent: globalMetrics?.aggregateTradingVolume?.changePercent || 0,
      icon: BarChart2
    },
    {
      title: "Active Bots",
      value: globalMetrics?.activeBotsRunning?.value || 0,
      trend: globalMetrics?.activeBotsRunning?.trend,
      changePercent: globalMetrics?.activeBotsRunning?.changePercent || 0,
      icon: Bot
    },
    {
      title: "Aggregate Profits",
      value: globalMetrics?.aggregateProfits?.value || 0,
      trend: globalMetrics?.aggregateProfits?.trend,
      changePercent: globalMetrics?.aggregateProfits?.changePercent || 0,
      icon: TrendingUp
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((metric, index) => (
        <Card key={metric.title} className={`relative overflow-hidden ${loading || isLoading ? 'opacity-60' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold">{metric.title}</CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading || isLoading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(metric.value)}</div>
                {/* {metric.trend && (
                  <div className={`text-xs mt-1 ${metric.trend === 'increasing' ? 'text-green-500' : metric.trend === 'decreasing' ? 'text-red-500' : 'text-gray-500'}`}>
                    {metric.trend === 'increasing' ? '↑' : metric.trend === 'decreasing' ? '↓' : '→'} {metric.changePercent}%
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Public metrics for all platform projects</p> */}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

