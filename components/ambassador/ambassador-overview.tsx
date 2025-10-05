'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { useSelector } from 'react-redux';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ChartColumnIncreasing,
  ScreenShare,
  Share,
  TrendingUp,
} from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataChart } from '@/components/ui/data-chart';
import {
  getEarningsBreakdown,
  getEnhancedOverview,
} from '@/services/ambassadorService';
import { RootState } from '@/store/store';
// import {
//   useAmbassadorEarningsBreakdown,
//   useEnhancedAmbassadorOverview,
// } from '@/hooks/useAmbassador';
// import { mockAmbassadorEarningsBreakdownData } from '@/lib/mock-data';

interface Metric {
  title: string;
  value: number;
  icon: LucideIcon;
  subtitle: string;
  isCurrency: boolean;
  subtitleColor?: string;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="h-5 w-3/4 bg-muted rounded-md animate-pulse" />
              <div className="h-8 w-1/2 mt-2 bg-muted rounded-md animate-pulse" />
              <div className="h-4 w-full mt-1 bg-muted rounded-md animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AmbassadorOverview() {
  // Check authentication state
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // ALL hooks must be called at the very top level, before any conditional returns
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    // error: overviewError,
  } = useQuery({
    queryKey: ['ambassadorEnhancedOverview'], // A unique key for this query
    queryFn: getEnhancedOverview, // The API function to call
    staleTime: 5 * 60 * 1000, // Optional: Cache data for 5 minutes
    enabled: isAuthenticated, // Only run query if user is authenticated
  });

  const {
    data: chartData,
    //  isLoading: isEarningsLoading
  } = useQuery({
    queryKey: ['ambassadorEarningsBreakdown'], // Use a different, unique key
    queryFn: getEarningsBreakdown,
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated, // Only run query if user is authenticated
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Set initial date range based on actual chart data
  useEffect(() => {
    if (chartData && chartData.length > 0 && !dateRange) {
      const dates = chartData
        .map((item) => new Date(item.date))
        .sort((a, b) => a.getTime() - b.getTime());
      const earliestDate = dates[0];
      const latestDate = dates[dates.length - 1];

      setDateRange({
        from: earliestDate,
        to: latestDate,
      });
    }
  }, [chartData, dateRange]);

  // Initialize state for animations - these need to be here to avoid conditional hook calls
  const [animatedMetrics, setAnimatedMetrics] = useState<Metric[]>([]);
  const [animatedStats, setAnimatedStats] = useState<any[]>([]);

  // Memoize metrics and quickStats - these are also hooks and must be at the top
  const metrics: Metric[] = useMemo(
    () => [
      {
        title: 'Lifetime Earning',
        value: overviewData?.totalEarned ?? 0,
        icon: TrendingUp,
        subtitle: 'Total earnings from all referrals',
        isCurrency: true,
      },
      {
        title: "Today's Earnings",
        value: overviewData?.todayEarnings ?? 0,
        icon: ChartColumnIncreasing,
        subtitle: `Weekly: $${overviewData?.weeklyEarnings?.toFixed(2) ?? '0.00'}`,
        isCurrency: true,
      },
      {
        title: 'Direct Referrals',
        value: overviewData?.directReferrals ?? 0,
        icon: Share,
        subtitle: 'Level 1 users you referred',
        isCurrency: false,
      },
      {
        title: 'Indirect Referrals',
        value: overviewData?.indirectReferrals ?? 0,
        icon: ScreenShare,
        subtitle: 'Level 2 users from your network',
        isCurrency: false,
      },
    ],
    [overviewData]
  );

  const quickStats = useMemo(
    () => [
      {
        label: 'Weekly Earnings',
        value: overviewData?.weeklyEarnings,
        isCurrency: true,
      },
      {
        label: 'Monthly Earnings',
        value: overviewData?.monthlyEarnings,
        isCurrency: true,
      },
      {
        label: 'Avg Daily Earning',
        value: overviewData?.averageDailyEarning,
        isCurrency: true,
      },
      {
        label: 'Top Referral',
        value: overviewData?.mostProfitableReferral?.projectName || 'N/A',
        isText: true,
      },
      {
        label: 'Ambassador Rank',
        value: overviewData?.ambassadorRank?.rank || 'N/A',
        isText: true,
      },
    ],
    [overviewData]
  );

  // useEffect must also be at the top level
  useEffect(() => {
    if (!overviewData) return;

    // Start with zero
    setAnimatedMetrics(metrics.map((m) => ({ ...m, value: 0 })));
    setAnimatedStats(
      quickStats.map((s) => ({ ...s, value: s.isText ? s.value : 0 }))
    );

    // Animate to actual values after a short delay
    const timer = setTimeout(() => {
      setAnimatedMetrics(metrics);
      setAnimatedStats(quickStats);
    }, 100);

    return () => clearTimeout(timer);
  }, [overviewData, metrics, quickStats]); // Now safe because metrics and quickStats are memoized

  // NOW we can have conditional returns after all hooks are declared
  if (isOverviewLoading) {
    return <OverviewSkeleton />;
  }

  // Handle unauthenticated users (after all hooks)
  if (!isAuthenticated) {
    return (
      <div className="text-center p-8 border border-muted rounded-lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
          <p className="text-muted-foreground">
            Please connect your wallet to view your ambassador dashboard and
            earnings.
          </p>
        </div>
      </div>
    );
  }

  // Handle error state (but not empty data for new users)
  if (isOverviewError) {
    return (
      <div className="text-center text-red-500 p-4 border border-red-500 rounded-md">
        Error loading dashboard data. Please try refreshing the page.
      </div>
    );
  }

  // Handle case where new user has no referral data yet
  if (!overviewData) {
    const emptyMetrics = [
      {
        title: 'Total Earned',
        value: 0,
        icon: TrendingUp,
        subtitle: 'Start referring to earn',
        isCurrency: true,
      },
      {
        title: 'Available Balance',
        value: 0,
        icon: ChartColumnIncreasing,
        subtitle: 'No earnings yet',
        isCurrency: true,
      },
      {
        title: 'Direct Referrals',
        value: 0,
        icon: Share,
        subtitle: 'Share your link to get started',
        isCurrency: false,
      },
      {
        title: 'Indirect Referrals',
        value: 0,
        icon: ScreenShare,
        subtitle: 'Grow your network',
        isCurrency: false,
      },
    ];

    return (
      <motion.div
        className="space-y-4 md:space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {emptyMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {metric.isCurrency ? '$' : ''}
                    <NumberFlow value={metric.value} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric.subtitle}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Earnings Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <p>
                No earnings data yet. Start referring users to see your earnings
                chart!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-4 md:space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {animatedMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold font-tt">
                  <NumberFlow
                    value={metric.value ?? 0}
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
                <p
                  className={`text-xs ${metric.subtitleColor || 'text-muted-foreground'}`}
                >
                  {metric.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataChart
        title="Earning over time"
        description="Your daily earning from the ambassador programs"
        data={chartData || []}
        yKey="earnings"
        xKey="date"
        color="hsl(var(--chart-1))"
        showDateRange={true}
        showDateButtons={true}
        showChartTypeSelector={true}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Commission structure */}
        <Card>
          <CardHeader>
            <CardTitle>Commission structure</CardTitle>
            <p className="text-sm text-muted-foreground">
              How you earn from referred projects
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2 border rounded-md p-4">
                <h4 className="font-bold text-lg font-tt">
                  Level 1 : Direct Referrals
                </h4>
                <p className="text-sm text-muted-foreground">
                  You earn 10% of all fees generated by projects that sign up
                  using your unique link.
                </p>
              </div>
              <div className="space-y-2 border rounded-md  p-4">
                <h4 className="font-bold text-lg font-tt">
                  Level 2 : Indirect Referrals
                </h4>
                <p className="text-sm text-muted-foreground">
                  You earn 3% of all fees generated by projects that your direct
                  referrals bring to Valmira.
                </p>
              </div>
              <div className="space-y-2 border rounded-md p-4">
                <h4 className="font-bold text-lg font-tt">Lifetime Payout</h4>
                <p className="text-sm text-muted-foreground">
                  As long as a referred project continues using Valmira, you
                  keep earning daily from their fees.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your ambassador performance at a glance
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {animatedStats.map((stat, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="text-sm">{stat.label}</span>
                  <span className="font-extrabold font-tt">
                    {stat.isText ? (
                      stat.value
                    ) : (
                      <NumberFlow
                        value={Number(stat.value)}
                        locales="en-US"
                        format={
                          stat.isCurrency
                            ? {
                                style: 'currency',
                                currency: 'USD',
                                // minimumFractionDigits: 2,
                                // maximumFractionDigits: 2
                              }
                            : {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }
                        }
                      />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
