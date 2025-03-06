import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, BarChart3, Bot, Droplet } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface ProjectMetricsProps {
  project?: {
    cumulativeProfit?: number
    tradingVolume24h?: number
    activeBots?: number
    liquidity?: number
  }
}

export function ProjectMetrics({ project }: ProjectMetricsProps) {
  // Define metrics with fallback values
  const metrics = [
    {
      title: "Profit Generated",
      value: project?.cumulativeProfit ?? 0,
      icon: TrendingUp,
      prefix: "$",
    },
    {
      title: "Trading Volume (24h)",
      value: project?.tradingVolume24h ?? 0,
      icon: BarChart3,
      prefix: "$",
    },
    {
      title: "Active Bots",
      value: project?.activeBots ?? 0,
      icon: Bot,
    },
    {
      title: "Liquidity",
      value: project?.liquidity ?? 0,
      icon: Droplet,
      prefix: "$",
    },
  ]

  // If project is null or undefined, show loading skeletons
  if (!project) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metric.prefix && metric.prefix}
              {formatNumber(metric.value)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

