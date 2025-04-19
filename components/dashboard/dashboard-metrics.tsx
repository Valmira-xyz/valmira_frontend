'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import {
  BarChart2,
  Bot,
  Briefcase,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { fetchBnbPrice, fetchGlobalMetrics } from '@/store/slices/projectSlice';
import { RootState } from '@/store/store';
import { AppDispatch } from '@/store/store';
// import { DashboardCharts } from "./dashboard-charts"

export function DashboardMetrics() {
  const dispatch = useDispatch<AppDispatch>();
  const { globalMetrics, loading } = useSelector(
    (state: RootState) => state.projects
  );
  const [isLoading, setIsLoading] = useState(true);
  const fetchInProgress = useRef(false);
  const hasInitialFetch = useRef(false);

  const fetchData = useCallback(async () => {
    // Skip if fetch is already in progress or if we've already fetched
    if (fetchInProgress.current || hasInitialFetch.current) return;

    setIsLoading(true);
    fetchInProgress.current = true;

    try {
      // Fetch global metrics data - available without authentication
      await Promise.all([
        dispatch(fetchGlobalMetrics()),
        dispatch(fetchBnbPrice()),
      ]);
      hasInitialFetch.current = true;
    } catch (error) {
      console.error('Error fetching global metrics:', error);
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Define metrics based on globalMetrics data
  const metrics = [
    {
      title: 'Total Projects',
      value: globalMetrics?.totalProjects?.value || 0,
      trend: globalMetrics?.totalProjects?.trend,
      changePercent: globalMetrics?.totalProjects?.changePercent || 0,
      icon: Briefcase,
    },
    {
      title: 'Total Funds Managed',
      value:
        Math.abs(Number(globalMetrics?.aggregateTradingVolume?.value || 0)) +
        Math.abs(Number(globalMetrics?.aggregateProfits?.value || 0)),
      trend: globalMetrics?.totalFundsManaged?.trend,
      changePercent: globalMetrics?.totalFundsManaged?.changePercent || 0,
      icon: DollarSign,
    },
    {
      title: 'Trading Volume',
      value: globalMetrics?.aggregateTradingVolume?.value || 0,
      trend: globalMetrics?.aggregateTradingVolume?.trend,
      changePercent: globalMetrics?.aggregateTradingVolume?.changePercent || 0,
      icon: BarChart2,
    },
    {
      title: 'Active Bots',
      value: globalMetrics?.activeBotsRunning?.value || 0,
      trend: globalMetrics?.activeBotsRunning?.trend,
      changePercent: globalMetrics?.activeBotsRunning?.changePercent || 0,
      icon: Bot,
    },
    {
      title: 'Aggregate Profits',
      value: globalMetrics?.aggregateProfits?.value || 0,
      trend: globalMetrics?.aggregateProfits?.trend,
      changePercent: globalMetrics?.aggregateProfits?.changePercent || 0,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric, index) => (
          <Card 
            key={index}
            className={`relative border overflow-hidden ${loading || isLoading ? 'opacity-60' : ''}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading || isLoading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {index !== 0 && index !== 3 ? '$' : ''}
                    {formatNumber(metric.value)}
                  </div>
                 {metric.trend && (
                  <div className={`text-xs mt-1 ${metric.trend === 'increasing' ? 'text-green-500' : metric.trend === 'decreasing' ? 'text-red-500' : 'text-gray-500'}`}>
                    {metric.trend === 'increasing' ? '↑' : metric.trend === 'decreasing' ? '↓' : '→'} {metric.changePercent}%
                    <span className="m-1 text-xs text-muted-foreground mt-2">from last month</span>
                  </div>
                )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {/* <DashboardCharts /> */}
    </div>
  );
}
