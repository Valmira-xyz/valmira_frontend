"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ExternalLink, Sparkles } from "lucide-react"
import { SparklineChart } from "@/components/ui/sparkline-chart"
import { cn, formatNumber } from "@/lib/utils"
import type { MouseEvent } from "react"
import { useRouter } from "next/navigation"

interface ProjectSummaryCardProps {
  project: {
    id: string
    name: string
    logo: string
    blockchain: string
    contractAddress: string
    status: "Active" | "Pending" | "Paused"
    cumulativeProfit: number
    tradingVolume24h: number
    activeBots: number
    profitTrend: number[]
    volumeTrend: number[]
    lastUpdated?: string
    apy?: number
    tvl?: number
    website?: string
  }
}

export function ProjectSummaryCard({ project }: ProjectSummaryCardProps) {
  const router = useRouter()

  // Format the last updated time if available
  const formattedLastUpdate = project.lastUpdated
    ? new Date(project.lastUpdated).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  // Determine badge color based on status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "success"
      case "Pending":
        return "warning"
      case "Paused":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`)
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
            <img src={project.logo || "/placeholder.svg"} alt={project.name} className="w-8 h-8 rounded-full" />
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </div>
          <Badge variant={getBadgeVariant(project.status)} className="font-medium text-sm px-3 py-1 rounded-full">
            {project.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center space-x-1 mt-1 py-2">
          <img
            src={`/blockchain-icons/${project.blockchain.toLowerCase()}.svg`}
            alt={project.blockchain}
            className="w-4 h-4"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=16&width=16"
            }}
          />
          <span>
            {project.contractAddress.slice(0, 6)}...{project.contractAddress.slice(-4)}
          </span>
          <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 -mr-1" onClick={(e) => e.stopPropagation()}>
            <a
              href={`https://etherscan.io/address/${project.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleExplorerClick}
            >
              <ExternalLink className="h-3 w-3" />
              <span className="sr-only">View on Explorer</span>
            </a>
          </Button>
          {project.website && (
            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 -mr-1" onClick={(e) => e.stopPropagation()}>
              <a href={project.website} target="_blank" rel="noopener noreferrer" onClick={handleExplorerClick}>
                <ExternalLink className="h-3 w-3" />
                <span className="sr-only">View Website</span>
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cumulative Profit</p>
            <p className="text-2xl font-bold text-primary">${formatNumber(project.cumulativeProfit)}</p>
            <div className="h-10">
              <SparklineChart data={project.profitTrend} color="hsl(var(--chart-1))" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">24h Volume</p>
            <p className="text-xl font-bold">${formatNumber(project.tradingVolume24h)}</p>
            <div className="h-10">
              <SparklineChart data={project.volumeTrend} color="hsl(var(--chart-2))" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Active Bots</p>
            <p className="text-xl font-bold">{project.activeBots}</p>
          </div>
          {formattedLastUpdate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>Last update: {formattedLastUpdate}</span>
            </div>
          )}
        </div>
        {project.apy && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground">APY</p>
            <p className="text-xl font-bold">{formatNumber(project.apy)}%</p>
          </div>
        )}
        {project.tvl && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground">TVL</p>
            <p className="text-xl font-bold">${formatNumber(project.tvl)}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button className="w-full bg-primary/90 hover:bg-primary" onClick={handleCardClick}>
          <Sparkles className="mr-2 h-4 w-4" /> View Details
        </Button>
      </CardFooter>
    </Card>
  )
}

