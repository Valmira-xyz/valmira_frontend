'use client';

import { useMemo } from 'react';

import { MetricCard } from './metric-card';
import {
  BarChart2,
  Bot,
  Briefcase,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

import { useGetGlobalMetricsQuery } from '@/store/api/project';

export function DashboardMetrics() {
  const { data: globalMetrics, isLoading } = useGetGlobalMetricsQuery();

  const metrics = useMemo(() => {
    if (!globalMetrics) return [];

    const {
      totalProjects,
      aggregateTradingVolume,
      activeBotsRunning,
      aggregateProfits,
      totalFundsManaged,
    } = globalMetrics;

    return [
      {
        title: 'Total Projects',
        value: totalProjects?.value || 0,
        trend: totalProjects?.trend,
        changePercent: totalProjects?.changePercent || 0,
        icon: Briefcase,
        valuePrefix: '',
      },
      {
        title: 'Total Funds Managed',
        value:
          Math.abs(Number(aggregateTradingVolume?.value || 0)) +
          Math.abs(Number(aggregateProfits?.value || 0)),
        trend: totalFundsManaged?.trend,
        changePercent: totalFundsManaged?.changePercent || 0,
        icon: DollarSign,
        valuePrefix: '$',
      },
      {
        title: 'Trading Volume',
        value: aggregateTradingVolume?.value || 0,
        trend: aggregateTradingVolume?.trend,
        changePercent: aggregateTradingVolume?.changePercent || 0,
        icon: BarChart2,
        valuePrefix: '$',
      },
      {
        title: 'Active Bots',
        value: activeBotsRunning?.value || 0,
        trend: activeBotsRunning?.trend,
        changePercent: activeBotsRunning?.changePercent || 0,
        icon: Bot,
        valuePrefix: '',
      },
      {
        title: 'Aggregate Profits',
        value: aggregateProfits?.value || 0,
        trend: aggregateProfits?.trend,
        changePercent: aggregateProfits?.changePercent || 0,
        icon: TrendingUp,
        valuePrefix: '$',
      },
    ];
  }, [globalMetrics]);

  return (
    <div className="overflow-x-hidden -mr-6">
      <div className="flex gap-4 overflow-x-auto no-scrollbar pr-6">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <MetricCard
                key={`loading-${index}`}
                title="Loading..."
                value={0}
                icon={Briefcase}
                isLoading={true}
                className="flex-shrink-0"
              />
            ))
          : metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} className="flex-shrink-0" />
            ))}
      </div>
    </div>
  );
}
