"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ExternalLink, Sparkles } from "lucide-react"
import { formatNumber, generateAvatarColor, getBadgeVariant } from "@/lib/utils"
import type { MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/store'
import type { ProjectWithAddons } from '@/types'
import { SparklineChart } from "../ui/sparkline-chart"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ProjectSummaryCardProps {
  project: ProjectWithAddons
}

export function ProjectSummaryCard({ project }: ProjectSummaryCardProps) {
  const router = useRouter()
  const { projects, projectStats } = useSelector((state: RootState) => state.projects)

  // Format the last updated time if available
  const formattedLastUpdate = project.metrics?.lastUpdate
    ? new Date(project.metrics.lastUpdate).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : project.updatedAt
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

  const metrics = project.metrics || {
    cumulativeProfit: 0,
    volume24h: 0,
    activeBots: 0,
    lastUpdate: project.updatedAt
  }

  const trends = projectStats?.trends || {
    profitTrend: [],
    volumeTrend: []
  }

  return (
    <Card
      className="overflow-hidden border border-base-border hover:border-primary/20 hover:bg-muted/10 transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <Avatar className="h-12 w-12">
            <AvatarFallback style={{ backgroundColor: generateAvatarColor(typeof project.owner === 'string' ? project.owner : project.owner.walletAddress) }}>
              {typeof project.owner === 'string'
                ? project.owner.slice(2, 4).toUpperCase()
                : project.owner.walletAddress.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center space-x-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>

            <div className="text-sm text-muted-foreground flex items-center space-x-1 mt-1 py-2">

              <span>
                {project.tokenAddress ? `${project.tokenAddress.slice(0, 6)}...${project.tokenAddress.slice(-4)}` : 'No Address'}
              </span>
              {project.tokenAddress && (
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
              )}
            </div>
          </div>
          <Badge variant={getBadgeVariant(project.status)} className="font-medium text-sm px-3 py-1 rounded-full">
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cumulative Profit</p>
            <p className="text-2xl font-bold text-primary">${formatNumber(metrics.cumulativeProfit)}</p>
            <div className="h-10">
              <SparklineChart data={trends.profitTrend.map(d => d.value)} color="hsl(var(--chart-1))" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">24h Volume</p>
            <p className="text-xl font-bold">${formatNumber(metrics.volume24h)}</p>
            <div className="h-10">
              <SparklineChart data={trends.volumeTrend.map(d => d.value)} color="hsl(var(--chart-3))" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div className="w-full p-2 flex justify-between items-center border rounded-md border-base-border ">
            <p className="text-xs font-medium text-muted-foreground">Active Bots</p>
            <p className="text-xl font-bold">{metrics.activeBots}</p>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center">
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

