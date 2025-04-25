'use client';

import type { DateRange } from 'react-day-picker';
import { useState, useEffect } from 'react';
import NumberFlow from '@number-flow/react';

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
      isCurrency: true,
    },
    {
      title: 'Trading Volume',
      value: 1250000,
      change: 8.3,
      icon: BarChart2,
      prefix: '$',
      isCurrency: true,
    },
    {
      title: 'Active Projects',
      value: 5,
      change: 0,
      icon: Wallet,
      isCurrency: false,
    },
    {
      title: 'Total Trades',
      value: 1842,
      change: -3.2,
      icon: Activity,
      isCurrency: false,
    },
  ];

  const [animatedMetrics, setAnimatedMetrics] = useState(metrics.map(m => ({ ...m, value: 0 })));

  useEffect(() => {
    // Start with zero
    setAnimatedMetrics(metrics.map(m => ({ ...m, value: 0 })));
    
    // Animate to actual values after a short delay
    const timer = setTimeout(() => {
      setAnimatedMetrics(metrics);
    }, 100);

    return () => clearTimeout(timer);
  }, [dateRange]); // Re-run when dateRange changes

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {animatedMetrics.map((metric, i) => (
        <Card className="border" key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-bold">{metric.title}</CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4">
            <div className="text-2xl font-bold">
              <NumberFlow 
                value={metric.value}
                format={metric.isCurrency ? {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                } : {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }}
              />
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
