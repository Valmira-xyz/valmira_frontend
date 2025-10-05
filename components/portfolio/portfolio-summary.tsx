'use client';

import { useEffect, useState } from 'react';
import { LuBot } from 'react-icons/lu';
import { LuDroplet } from 'react-icons/lu';

import { ChartColumnIncreasing, TrendingUp } from 'lucide-react';
import NumberFlow from '@number-flow/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PortfolioSummaryProps {
  globalMetrics: any;
  isLoading: boolean;
}

export function PortfolioSummary({
  globalMetrics,
  isLoading,
}: PortfolioSummaryProps) {
  const [animatedMetrics, setAnimatedMetrics] = useState<typeof metrics>([]);

  // Define metrics based on globalMetrics data
  const metrics = [
    {
      title: 'Total Profit',
      value: globalMetrics?.aggregateProfits?.value || 0,
      trend: globalMetrics?.aggregateProfits?.monthlyTrend,
      changePercent: globalMetrics?.aggregateProfits?.monthlyChangePercent || 0,
      icon: TrendingUp,
      prefix: '$',
      isCurrency: true,
    },
    {
      title: 'Trading Volume',
      value: globalMetrics?.aggregateTradingVolume?.value || 0,
      trend: globalMetrics?.aggregateTradingVolume?.monthlyTrend,
      changePercent:
        globalMetrics?.aggregateTradingVolume?.monthlyChangePercent || 0,
      icon: ChartColumnIncreasing,
      prefix: '$',
      isCurrency: true,
    },
    {
      title: 'Active Projects',
      value: globalMetrics?.totalActiveProjects?.value || 0,
      trend: globalMetrics?.totalActiveProjects?.monthlyTrend,
      changePercent:
        globalMetrics?.totalActiveProjects?.monthlyChangePercent || 0,
      icon: LuBot,
      isCurrency: false,
    },
    {
      title: 'Total Trades',
      value: globalMetrics?.totalTradeCount?.value || 0,
      trend: globalMetrics?.totalTradeCount?.monthlyTrend,
      changePercent: globalMetrics?.totalTradeCount?.monthlyChangePercent || 0,
      icon: LuDroplet,
      isCurrency: false,
    },
  ];

  useEffect(() => {
    if (!isLoading && globalMetrics) {
      // Set initial values to 0
      setAnimatedMetrics(metrics.map((metric) => ({ ...metric, value: 0 })));
      // Then update to actual values after a short delay
      setTimeout(() => {
        setAnimatedMetrics(metrics);
      }, 100);
    }
  }, [isLoading, globalMetrics]);

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {(animatedMetrics.length ? animatedMetrics : metrics).map((metric, i) => (
        <Card key={i} className={`border ${isLoading ? 'opacity-60' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0  !p-3 sm:!p-3 md:!p-3 !pb-1 sm:!pb-1 md:!pb-1 ">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="sm:!p-3 md:!p-3 !p-3 sm:!pt-0 md:!pt-0 !pt-0">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="text-md sm:text-2xl font-bold font-tt">
                  <NumberFlow
                    value={metric.value}
                    locales="en-US"
                    format={
                      metric.isCurrency
                        ? {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        : {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {metric.trend && (
                    <div
                      className={`text-xs mt-1 ${metric.trend === 'increasing' ? 'text-green-500' : metric.trend === 'decreasing' ? 'text-red-500' : 'text-gray-500'}`}
                    >
                      {metric.trend === 'increasing'
                        ? '↑'
                        : metric.trend === 'decreasing'
                          ? '↓'
                          : '→'}{' '}
                      {metric.changePercent}%
                      <span className="m-1 text-xs text-muted-foreground mt-2">
                        from last month
                      </span>
                    </div>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
