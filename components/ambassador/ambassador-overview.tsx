'use client';

import { useState } from 'react';
import { type DateRange } from 'react-day-picker';
import { ArrowUpRight, ExternalLink, MoveUpRight, ArrowRightLeft, TrendingUp, ChartColumnIncreasing, Share, ScreenShare } from 'lucide-react';
import { addDays, subDays, subWeeks, subMonths, subYears, format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortfolioChart } from '@/components/portfolio/portfolio-chart';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AmbassadorOverviewProps {
  dateRange?: DateRange;
}

type TimeRange = '1D' | '1W' | '1M' | '1Y';

// Generate mock data for different time ranges
const generateMockData = (start: Date, end: Date) => {
  const data = [];
  let current = start;
  while (current <= end) {
    data.push({
      name: format(current, 'MMM dd'),
      profit: Math.floor(Math.random() * 3000) + 1000, // Random value between 1000 and 4000
      volume: Math.floor(Math.random() * 100000) + 50000,
      trades: Math.floor(Math.random() * 50) + 10,
    });
    current = addDays(current, 1);
  }
  return data;
};

export function AmbassadorOverview({ dateRange: initialDateRange }: AmbassadorOverviewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Calculate date range based on selected time range
  const getDateRangeFromTimeRange = (range: TimeRange): DateRange => {
    const end = new Date();
    let start: Date;

    switch (range) {
      case '1D':
        start = subDays(end, 1);
        break;
      case '1W':
        start = subWeeks(end, 1);
        break;
      case '1M':
        start = subMonths(end, 1);
        break;
      case '1Y':
        start = subYears(end, 1);
        break;
      default:
        start = subDays(end, 1);
    }

    return { from: start, to: end };
  };

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as TimeRange);
    setDateRange(getDateRangeFromTimeRange(value as TimeRange));
  };

  // Format date range for display
  const formatDateRange = () => {
    const range = dateRange || getDateRangeFromTimeRange(timeRange);
    if (!range.from || !range.to) return '';
    return `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Lifetime Earning */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Lifetime Earning</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">$2,802.00</div>
              <p className="text-xs text-muted-foreground">Total earnings</p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Earnings */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
              <ChartColumnIncreasing className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">$45.55</div>
              <p className="text-xs text-green-600">+12% from yesterday</p>
            </div>
          </CardContent>
        </Card>

        {/* Direct Referral */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Direct Referral</CardTitle>
              <Share className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Level 1 projects you've referred</p>
            </div>
          </CardContent>
        </Card>

        {/* Indirect Referral */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Indirect Referral</CardTitle>
              <ScreenShare className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Level 2 projects from your network</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earning over time chart */}
      {/* <Card className="border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Earning over time</CardTitle>
            <p className="text-sm text-muted-foreground">Your daily earning from the ambassadors programs</p>
          </div>
          <div className="flex items-center space-x-4">
            <Tabs value={timeRange} onValueChange={handleTimeRangeChange} className="w-fit">
              <TabsList>
                <TabsTrigger value="1D">1D</TabsTrigger>
                <TabsTrigger value="1W">1W</TabsTrigger>
                <TabsTrigger value="1M">1M</TabsTrigger>
                <TabsTrigger value="1Y">1Y</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground'
                  )}
                >
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    setIsCalendarOpen(false);
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader> */}
        <CardContent className="p-0">
          <PortfolioChart 
            dateRange={dateRange}
            metric="profit"
            height={300}
          />
        </CardContent>
      {/* </Card> */}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Commission structure */}
        <Card>
          <CardHeader>
            <CardTitle>Commission structure</CardTitle>
            <p className="text-sm text-muted-foreground">How you earn from referred projects</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2 border rounded-md p-4">
                <h4 className="font-medium">Level 1 : Direct Referrals</h4>
                <p className="text-sm text-muted-foreground">
                  You earn 10% of all fees generated by projects that sign up using your unique link.
                </p>
              </div>
              <div className="space-y-2 border rounded-md p-4">
                <h4 className="font-medium">Level 2 : Indirect Referrals</h4>
                <p className="text-sm text-muted-foreground">
                  You earn 3% of all fees generated by projects that your direct referrals bring to Valmira.
                </p>
              </div>
              <div className="space-y-2 border rounded-md p-4">
                <h4 className="font-medium">Lifetime Payout</h4>
                <p className="text-sm text-muted-foreground">
                  As long as a referred project continues using Valmira, you keep earning daily from their fees.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <p className="text-sm text-muted-foreground">Your ambassador performance at a glance</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between py-2">
                <span className="text-foreground">Weekly Earnings</span>
                <span className="font-medium">$1234</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-foreground">Monthly Earnings</span>
                <span className="font-medium">$1234</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-foreground">Average Daily Earning</span>
                <span className="font-medium">$1234</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-foreground">Most Profitable Referral</span>
                <span className="font-medium">PEPE ($123)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-foreground">Ambassador Rank</span>
                <span className="font-medium">Silver</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 