"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, DollarSign, BarChart2, Bot, TrendingUp } from "lucide-react"
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { cn, formatNumber } from "@/lib/utils"

const metrics = [
  {
    title: "Total Projects",
    value: 1234,
    icon: Briefcase,
    chart: [
      { name: "Jan", value: 1000 },
      { name: "Feb", value: 1100 },
      { name: "Mar", value: 1150 },
      { name: "Apr", value: 1234 },
    ],
  },
  {
    title: "Total Funds Managed",
    value: 1200000000, // $1.2B
    icon: DollarSign,
    chart: [
      { name: "Jan", value: 900000000 },
      { name: "Feb", value: 1000000000 },
      { name: "Mar", value: 1100000000 },
      { name: "Apr", value: 1200000000 },
    ],
  },
  {
    title: "Aggregate Trading Volume",
    value: 5600000000, // $5.6B
    icon: BarChart2,
    chart: [
      { name: "Jan", value: 4000000000 },
      { name: "Feb", value: 4500000000 },
      { name: "Mar", value: 5000000000 },
      { name: "Apr", value: 5600000000 },
    ],
  },
  {
    title: "Active Bots Running",
    value: 3456,
    icon: Bot,
    chart: [
      { name: "Jan", value: 3000 },
      { name: "Feb", value: 3200 },
      { name: "Mar", value: 3350 },
      { name: "Apr", value: 3456 },
    ],
  },
  {
    title: "Aggregate Profits",
    value: 78900000, // $78.9M
    icon: TrendingUp,
    chart: [
      { name: "Jan", value: 60000000 },
      { name: "Feb", value: 65000000 },
      { name: "Mar", value: 72000000 },
      { name: "Apr", value: 78900000 },
    ],
  },
]

export function DashboardMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((metric) => (
        <Card key={metric.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold">{metric.title}</CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metric.value)}</div>
            <div className="h-[70px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metric.chart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  {payload[0].payload.name}
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {typeof payload[0].value === 'number' ? formatNumber(payload[0].value) : '0'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <XAxis dataKey="name" tick={{ fill: "#A1A1A1" }} />
                  <YAxis tick={{ fill: "#A1A1A1" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

