'use client';

import type { MouseEvent } from 'react';

import { Clock, ExternalLink, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  formatNumber,
  generateAvatarColor,
  getBadgeVariant,
} from '@/lib/utils';
import type { ProjectWithAddons } from '@/types';

interface ProjectSummaryCardProps {
  project: ProjectWithAddons;
}

export function ProjectSummaryCard({ project }: ProjectSummaryCardProps) {
  const router = useRouter();
  // const { projectStats } = useSelector(
  //   (state: RootState) => state.projects
  // );

  // Format the last updated time if available
  const formattedLastUpdate = project.metrics?.lastUpdate
    ? new Date(project.metrics.lastUpdate).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : project.updatedAt
      ? new Date(project.updatedAt).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

  const handleCardClick = () => {
    router.push(`/projects/${project._id}`);
  };

  const handleExplorerClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation(); // Prevent the card click from triggering
  };

  const metrics = project.metrics || {
    cumulativeProfit: 0,
    tradingVolume: 0,
    activeBots: 0,
    lastUpdate: project.updatedAt,
  };

  // const trends = projectStats?.trends || {
  //   profitTrend: [],
  //   volumeTrend: [],
  // };

  return (
    <Card
      className="overflow-hidden border border-base-border hover:border-primary/20 hover:bg-muted/10 transition-all duration-200 cursor-pointer flex flex-col h-full justify-between"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-4 space-y-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-3 items-center">
            <Avatar className="h-10 w-10">
              <AvatarFallback
                style={{
                  backgroundColor: generateAvatarColor(
                    typeof project.owner === 'string'
                      ? project.owner
                      : project.owner.walletAddress
                  ),
                }}
              >
                {typeof project.owner === 'string'
                  ? project.owner.slice(2, 4).toUpperCase()
                  : project.owner.walletAddress.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <CardTitle className="text-md">{project.name}</CardTitle>

              <div className="text-sm text-muted-foreground flex items-center">
                <span>
                  {project.tokenAddress
                    ? `${project.tokenAddress.slice(0, 6)}...${project.tokenAddress.slice(-4)}`
                    : 'No Address'}
                </span>
                {project.tokenAddress && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 -mr-1"
                    onClick={(e) => e.stopPropagation()}
                  >
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
          </div>
          <Badge
            variant={getBadgeVariant(project.status)}
            className="font-medium text-sm px-3 py-1 rounded-full"
          >
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex w-full flex-col items-start justify-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Cumulative Profit
            </p>
            <p className="text-xl font-bold text-primary">
              ${formatNumber(metrics.cumulativeProfit)}
            </p>
            {/* <div className="h-10">
              <SparklineChart data={trends.profitTrend.map(d => d.value)} color="hsl(var(--chart-1))" />
            </div> */}
          </div>
          <div className="flex w-full flex-col items-end justify-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Cumulative Volume
            </p>
            <p className="text-xl font-bold">
              ${formatNumber(metrics.tradingVolume)}
            </p>
            {/* <div className="h-10">
              <SparklineChart data={trends.volumeTrend.map(d => d.value)} color="hsl(var(--chart-3))" />
            </div> */}
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div className="w-full p-2 flex justify-between items-center border rounded-md border-base-border ">
            <p className="text-xs font-medium text-muted-foreground">
              Active Bots
            </p>
            <p className="text-xl font-bold">
              {metrics.activeBots > 0
                ? metrics.activeBots
                : project?.addons
                  ? Object.values(project.addons).reduce(
                      (sum: number, addon: any) =>
                        sum + (addon?.isEnabled ? 1 : 0),
                      0
                    )
                  : 0}
            </p>
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
        <Button
          className="w-full bg-primary/90 hover:bg-primary"
          onClick={handleCardClick}
        >
          <Sparkles className="mr-2 h-4 w-4" /> View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
