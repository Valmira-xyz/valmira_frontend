'use client';

import type { DateRange } from 'react-day-picker';

import { differenceInDays } from 'date-fns';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface PortfolioSummaryProps {
  dateRange: DateRange | undefined;
}

export function PortfolioSummary({ dateRange }: PortfolioSummaryProps) {
  // Calculate date range for comparison
  const days =
    dateRange?.from && dateRange?.to
      ? differenceInDays(dateRange.to, dateRange.from) + 1
      : 7;

  // Mock data - in a real app, this would come from an API
  const metrics = [
    {
      title: 'Total Profit',
      value: 24680,
      change: 12.5,
      icon: TrendingUp,
      prefix: '$',
    },
    {
      title: 'Trading Volume',
      value: 1250000,
      change: 8.3,
      icon: BarChart2,
      prefix: '$',
    },
    {
      title: 'Active Projects',
      value: 5,
      change: 0,
      icon: Wallet,
    },
    {
      title: 'Total Trades',
      value: 1842,
      change: -3.2,
      icon: Activity,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metric.prefix && metric.prefix}
              {formatNumber(metric.value)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metric.change !== 0 && (
                <span
                  className={`inline-flex items-center ${metric.change > 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {metric.change > 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(metric.change)}% from previous {days} days
                </span>
              )}
              {metric.change === 0 && (
                <span className="text-muted-foreground">
                  No change from previous {days} days
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
