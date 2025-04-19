import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { format, subDays } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { formatCurrency } from '@/lib/utils';

type TimePeriod = '1D' | '1W' | '1M' | '1Y';

interface AnalyticsChartProps {
  title: string;
  description: string;
  type: 'profit' | 'volume';
}

const chartColors = {
  profit: '#22c55e',
  volume: '#3b82f6',
};

// Mock data generation
const generateMockData = (days: number) => {
  const data = [];
  const baseValue = 1000;
  let currentValue = baseValue;

  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const randomChange = Math.random() * 200 - 100; // Random value between -100 and 100
    currentValue = Math.max(0, currentValue + randomChange);

    data.push({
      timestamp: date.getTime(),
      value: currentValue,
    });
  }
  return data;
};

export function AnalyticsChart({
  title,
  description,
  type,
}: AnalyticsChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1M');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Generate mock data based on time period
  const mockData = useMemo(() => {
    switch (timePeriod) {
      case '1D':
        return generateMockData(1);
      case '1W':
        return generateMockData(7);
      case '1M':
        return generateMockData(30);
      case '1Y':
        return generateMockData(365);
      default:
        return generateMockData(30);
    }
  }, [timePeriod]);

  const TimePeriodButtons = () => (
    <div className="inline-flex items-center rounded-md bg-muted p-1 text-muted-foreground gap-1">
      {(['1D', '1W', '1M', '1Y'] as TimePeriod[]).map((period) => (
        <Button
          key={period}
          variant={timePeriod === period ? 'default' : 'ghost'}
          className={`text-xs px-3 ${
            timePeriod === period ? 'bg-background text-foreground' : ''
          }`}
          onClick={() => setTimePeriod(period)}
          size="sm"
        >
          {period}
        </Button>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex xl:flex-row flex-col items-start gap-2 xl:items-center xl:justify-between">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <TimePeriodButtons />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData}>
              <defs>
                <linearGradient
                  id={`gradient-${type}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={chartColors[type]}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="100%"
                    stopColor={chartColors[type]}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) =>
                  format(value, timePeriod === '1D' ? 'HH:mm' : 'MMM dd')
                }
                interval="preserveStartEnd"
                stroke="#9ca3af"
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                stroke="#9ca3af"
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip
                labelFormatter={(label) =>
                  format(
                    label as number,
                    timePeriod === '1D' ? 'HH:mm' : 'MMM dd, yyyy'
                  )
                }
                formatter={(value: any) => [
                  formatCurrency(value as number),
                  type === 'profit' ? 'Profit' : 'Volume',
                ]}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColors[type]}
                strokeWidth={2}
                fill={`url(#gradient-${type})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
