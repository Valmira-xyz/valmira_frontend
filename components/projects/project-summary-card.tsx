"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ExternalLink, Sparkles } from "lucide-react"
import { cn, formatNumber, genRandomSparklineData, getBadgeVariant } from "@/lib/utils"
import type { MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/store'
import type { Project } from '@/types'
import { SparklineChart } from "../ui/sparkline-chart"

interface ProjectSummaryCardProps {
  project: Project
}

export function ProjectSummaryCard({ project }: ProjectSummaryCardProps) {
  const router = useRouter()
  const { projects } = useSelector((state: RootState) => state.projects || [])

  const totalProfit = projects.reduce((sum: number, project: Project) => 
    sum + (project.metrics?.cumulativeProfit || 0), 0
  )
  
  const totalVolume = projects.reduce((sum: number, project: Project) => 
    sum + (project.metrics?.volume24h || 0), 0
  )
  
  const activeProjects = projects.filter((project: Project) => 
    project.status === 'active'
  ).length
  
  const totalBots = projects.reduce((sum: number, project: Project) => 
    sum + (project.metrics?.activeBots || 0), 0
  )

  // Format the last updated time if available
  const formattedLastUpdate = project.updatedAt
    ? new Date(project.updatedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null


  const handleCardClick = () => {
    router.push(`/projects/${project._id}`)
  }

  const handleExplorerClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation() // Prevent the card click from triggering
  }

  return (
    <Card
      className="overflow-hidden border-muted/60 hover:border-primary/20 hover:bg-muted/10 transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </div>
          <Badge variant={getBadgeVariant(project.status)} className="font-medium text-sm px-3 py-1 rounded-full">
            {project.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center space-x-1 mt-1 py-2">
          <img
            src={`/blockchain-icons/${project.chainName?.toLowerCase()}.svg`}
            alt={project.chainId?.toString()}
            className="w-4 h-4"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=16&width=16"
            }}
          />
          <span>
            {project.tokenAddress.slice(0, 6)}...{project.tokenAddress.slice(-4)}
          </span>
          <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 -mr-1" onClick={(e) => e.stopPropagation()}>
            <a
              href={`https://etherscan.io/address/${project.tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleExplorerClick}
            >
              <ExternalLink className="h-3 w-3" />
              <span className="sr-only">View on Explorer</span>
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cumulative Profit</p>
            <p className="text-2xl font-bold text-primary">${formatNumber(project.metrics.cumulativeProfit)}</p>
            <div className="h-10">
              <SparklineChart data={(project.profitTrend && project.profitTrend?.length > 0) ? project.profitTrend : genRandomSparklineData(4)} color="hsl(var(--chart-1))" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">24h Volume</p>
            <p className="text-xl font-bold">${formatNumber(project.metrics.volume24h)}</p>
            <div className="h-10">
              <SparklineChart data={(project.volumeTrend && project.volumeTrend?.length >0)? project.volumeTrend: genRandomSparklineData(4) } color="hsl(var(--chart-3))" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Active Bots</p>
            <p className="text-xl font-bold">{project.metrics.activeBots}</p>
          </div>
          {formattedLastUpdate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>Last update: {formattedLastUpdate}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button className="w-full bg-primary/90 hover:bg-primary" onClick={handleCardClick}>
          <Sparkles className="mr-2 h-4 w-4" /> View Details
        </Button>
      </CardFooter>
    </Card>
  )
}

