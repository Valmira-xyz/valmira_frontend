'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import {
  BarChart2,
  Bot,
  Briefcase,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import NumberFlow from '@number-flow/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  fetchGlobalMetrics,
  fetchNativeCurrencyPrice,
} from '@/store/slices/projectSlice';
import { RootState } from '@/store/store';
import { AppDispatch } from '@/store/store';

export function DashboardMetrics() {
  const dispatch = useDispatch<AppDispatch>();
  const { globalMetrics } = useSelector((state: RootState) => state.projects);
  const [isLoading, setIsLoading] = useState(true);
  const [animatedMetrics, setAnimatedMetrics] = useState<typeof metrics>([]);
  const fetchInProgress = useRef(false);

  const fetchData = useCallback(async () => {
    // Skip if fetch is already in progress
    if (fetchInProgress.current) return;

    setIsLoading(true);
    fetchInProgress.current = true;

    try {
      // Fetch global metrics data - available without authentication
      await Promise.all([
        dispatch(fetchGlobalMetrics()),
        dispatch(fetchNativeCurrencyPrice()),
      ]);
    } catch (error) {
      console.error('Error fetching global metrics:', error);
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    // Only fetch if we don't have global metrics yet
    if (!globalMetrics) {
      fetchData();
    } else {
      // If we already have data, don't show loading
      setIsLoading(false);
    }
  }, [fetchData, globalMetrics]);

  // Define metrics based on globalMetrics data - memoized to avoid recalculation
  const metrics = useMemo(
    () => [
      {
        title: 'Total Projects',
        value: globalMetrics?.totalProjects?.value || 0,
        trend: globalMetrics?.totalProjects?.monthlyTrend,
        changePercent: globalMetrics?.totalProjects?.changePercent || 0,
        icon: Briefcase,
      },
      {
        title: 'Total Funds Managed',
        value:
          Math.abs(Number(globalMetrics?.aggregateTradingVolume?.value || 0)) +
          Math.abs(Number(globalMetrics?.aggregateProfits?.value || 0)),
        trend: globalMetrics?.totalFundsManaged?.monthlyTrend,
        changePercent:
          globalMetrics?.totalFundsManaged?.monthlyChangePercent || 0,
        icon: DollarSign,
      },
      {
        title: 'Aggregate Trading Volume',
        value: globalMetrics?.aggregateTradingVolume?.value || 0,
        trend: globalMetrics?.aggregateTradingVolume?.monthlyTrend,
        changePercent:
          globalMetrics?.aggregateTradingVolume?.monthlyChangePercent || 0,
        icon: BarChart2,
      },
      {
        title: 'Active Running Bots',
        value: globalMetrics?.activeBotsRunning?.value || 0,
        trend: globalMetrics?.activeBotsRunning?.monthlyTrend,
        changePercent:
          globalMetrics?.activeBotsRunning?.monthlyChangePercent || 0,
        icon: Bot,
      },
      {
        title: 'Aggregate Profits',
        value: globalMetrics?.aggregateProfits?.value || 0,
        trend: globalMetrics?.aggregateProfits?.monthlyTrend,
        changePercent:
          globalMetrics?.aggregateProfits?.monthlyChangePercent || 0,
        icon: TrendingUp,
      },
    ],
    [globalMetrics]
  );

  useEffect(() => {
    if (!isLoading && globalMetrics) {
      // Set initial values to 0
      setAnimatedMetrics(metrics.map((metric) => ({ ...metric, value: 0 })));
      // Then update to actual values after a short delay
      setTimeout(() => {
        setAnimatedMetrics(metrics);
      }, 100);
    }
  }, [isLoading, globalMetrics, metrics]);

  return (
    <div className="space-y-2">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {(animatedMetrics.length ? animatedMetrics : metrics).map(
          (metric, index) => (
            <Card
              key={index}
              className={`relative border overflow-hidden p-2 dark:bg-[hsl(var(--card-dark-bg))] ${isLoading ? 'opacity-60' : ''} `}
            >
              <CardHeader className="flex flex-row items-start justify-start space-y-0 !pb-1 !pl-2 !pt-1 ml-0 !mb-1">
                <CardTitle className="text-xs font-light text-foreground line-clamp-1">
                  {metric.title}
                </CardTitle>
                {/* <metric.icon className="h-4 w-4 text-muted-foreground" /> */}
              </CardHeader>
              <CardContent className="!pt-0 !pb-1 !mb-0 !pl-2">
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold font-tt">
                      {index !== 0 && index !== 3 ? (
                        <NumberFlow
                          value={metric.value}
                          locales="en-US"
                          format={{
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }}
                        />
                      ) : (
                        <NumberFlow
                          value={metric.value}
                          format={{
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }}
                        />
                      )}
                    </div>
                    {/* {metric.trend && (
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
                    )} */}
                  </>
                )}
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
