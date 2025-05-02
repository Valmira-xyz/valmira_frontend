'use client';

import { useState, useMemo } from 'react';
import { type DateRange } from 'react-day-picker';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import { DateRangePicker } from '@/components/date-range-picker';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { subDays, subWeeks, subMonths, startOfDay, endOfDay, parseISO, isWithinInterval, format, differenceInDays, addHours, addDays, isSameDay, isBefore, isAfter, differenceInMilliseconds } from 'date-fns';
import { ChartColumnBig, ChartArea, ChartSpline } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Spinner } from './spinner';

export interface DataChartProps {
  title: string;
  description?: string;
  data: any[];
  dataKey?: string;
  xKey?: string;
  yKey?: string;
  color?: string;
  height?: number;
  showDateRange?: boolean;
  showDateButtons?: boolean;
  showChartTypeSelector?: boolean;
  showHeaderInVertical?: boolean;
  className?: string;
  isLoading?: boolean;
  emptyStateMessage?: string;
  emptyStateIcon?: React.ReactNode;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

export function DataChart({
  title,
  description,
  data,
  dataKey,
  xKey = 'date',
  yKey,
  color = 'hsl(var(--primary))',
  height = 350,
  showDateRange = true,
  showDateButtons = true,
  showChartTypeSelector = true,
  showHeaderInVertical = false,
  className,
  isLoading = false,
  emptyStateMessage = "No data available",
  emptyStateIcon,
  dateRange,
  onDateRangeChange,
}: DataChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('bar');

  const selectedDateButton = useMemo(() => {
    const diffInDays = differenceInDays(dateRange?.to ?? new Date(), dateRange?.from ?? subDays(new Date(), 1));
    if (diffInDays > 7) return '1M';
    if (diffInDays == 1) return '1D';
    return '1W';
  }, [dateRange]);

  const actualYKey = yKey || dataKey || 'value';

  // Filter data based on date range
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!item[xKey]) return true;
      try {
        const itemDate = parseISO(item[xKey]);
        const start = startOfDay(dateRange?.from ?? subDays(new Date(), 1));
        const end = dateRange?.to ? endOfDay(dateRange.to) : endOfDay(new Date());
        return isWithinInterval(itemDate, { start, end });
      } catch (error) {
        console.error('Error parsing date:', error);
        return false;
      }
    });
  }, [data, xKey, dateRange]);

  // Add these helper functions at the top of the file
  const getTimeIntervals = (range: DateRange | undefined, button: string) => {
    const now = new Date();
    let intervals: Date[] = [];
    let interval: number;

    if (range?.from) {
      const diffInDays = differenceInDays(range.to || now, range.from);
      if (diffInDays <= 1) {
        // 1D range with 2-hour intervals
        interval = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        const start = startOfDay(range.from);
        for (let i = 0; i <= 24; i += 2) {
          intervals.push(addHours(start, i));
        }
      } else if (diffInDays <= 7) {
        // 1W range with 1-day intervals
        interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        const start = startOfDay(range.from);
        for (let i = 0; i <= diffInDays; i++) {
          intervals.push(addDays(start, i));
        }
      } else {
        // 1M range with 1-day intervals
        interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        const start = startOfDay(range.from);
        for (let i = 0; i <= diffInDays; i++) {
          intervals.push(addDays(start, i));
        }
      }
    } else {
      switch (button) {
        case '1D':
          // 1D with 2-hour intervals
          interval = 2 * 60 * 60 * 1000;
          const start = startOfDay(subDays(now, 1));
          for (let i = 0; i <= 24; i += 2) {
            intervals.push(addHours(start, i));
          }
          break;
        case '1W':
          // 1W with 1-day intervals
          interval = 24 * 60 * 60 * 1000;
          const weekStart = startOfDay(subWeeks(now, 1));
          for (let i = 0; i <= 7; i++) {
            intervals.push(addDays(weekStart, i));
          }
          break;
        case '1M':
          // 1M with 1-day intervals
          interval = 24 * 60 * 60 * 1000;
          const monthStart = startOfDay(subMonths(now, 1));
          for (let i = 0; i <= 30; i++) {
            intervals.push(addDays(monthStart, i));
          }
          break;
      }
    }

    return intervals;
  };

  const interpolateData = (data: any[], intervals: Date[], xKey: string, yKey: string) => {
    // If there's no data at all, return empty array
    if (!data || data.length === 0) {
      return [];
    }

    return intervals.map(interval => {
      // Find data points within this interval
      const intervalData = data.filter(item => {
        try {
          const itemDate = parseISO(item[xKey]);
          if (selectedDateButton === '1D' || (dateRange?.from && differenceInDays(dateRange.to || new Date(), dateRange.from) <= 1)) {
            // For 1D view, check if the hour matches
            return format(itemDate, 'yyyy-MM-dd HH') === format(interval, 'yyyy-MM-dd HH');
          } else {
            // For 1W and 1M views, check if the day matches
            return format(itemDate, 'yyyy-MM-dd') === format(interval, 'yyyy-MM-dd');
          }
        } catch (error) {
          return false;
        }
      });

      // If we have data points, calculate the appropriate value based on the chart type
      if (intervalData.length > 0) {
        if (chartType === 'bar') {
          // For bar charts, sum the values
          const sum = intervalData.reduce((acc, item) => {
            const value = Number(item[yKey]) || 0;
            return acc + value;
          }, 0);
          return {
            [xKey]: format(interval, 'yyyy-MM-dd HH:mm:ss'),
            [yKey]: sum
          };
        } else {
          // For line and area charts, use the average value
          const sum = intervalData.reduce((acc, item) => {
            const value = Number(item[yKey]) || 0;
            return acc + value;
          }, 0);
          const average = sum / intervalData.length;
          return {
            [xKey]: format(interval, 'yyyy-MM-dd HH:mm:ss'),
            [yKey]: average
          };
        }
      }

      // If no data points found, return 0
      return {
        [xKey]: format(interval, 'yyyy-MM-dd HH:mm:ss'),
        [yKey]: 0
      };
    });
  };

  const groupedData = useMemo(() => {
    const intervals = getTimeIntervals(dateRange, selectedDateButton);
    return interpolateData(filteredData, intervals, xKey, actualYKey);
  }, [filteredData, dateRange, selectedDateButton, xKey, actualYKey]);

  const xAxisTicks = useMemo(() => {
    if (selectedDateButton === '1M' && groupedData.length > 0) {
      // Show every 2nd date
      return groupedData
        .filter((_, idx) => idx % 2 === 0)
        .map(item => item[xKey]);
    }
    // For other ranges, let recharts auto-calculate
    return undefined;
  }, [selectedDateButton, groupedData, xKey]);

  const handleDateButtonChange = (value: string) => {
    const now = new Date();
    let start: Date;

    switch (value) {
      case '1D':
        start = subDays(now, 1);
        break;
      case '1W':
        start = subWeeks(now, 1);
        break;
      case '1M':
        start = subMonths(now, 1);
        break;
      default:
        return;
    }

    onDateRangeChange?.({
      from: start,
      to: now
    });
  };

  const formatXAxis = (date: string) => {
    try {
      const parsedDate = parseISO(date);
      if (selectedDateButton === '1D' || (dateRange?.from && differenceInDays(dateRange.to || new Date(), dateRange.from) <= 1)) {
        return format(parsedDate, 'HH:mm');
      } else {
        return format(parsedDate, 'MMM d');
      }
    } catch (error) {
      return date;
    }
  };

  const formatTooltipDate = (date: string) => {
    try {
      const parsedDate = parseISO(date);
      if (selectedDateButton === '1D' || (dateRange?.from && differenceInDays(dateRange.to || new Date(), dateRange.from) <= 1)) {
        return format(parsedDate, 'HH:mm, MMM d');
      } else {
        return format(parsedDate, 'MMM d, yyyy');
      }
    } catch (error) {
      return date;
    }
  };

  const renderChart = () => {
    console.log(`rendering real chart`);
    console.log(`\n =============== groupedData ===============\n${JSON.stringify(groupedData, null, 2)}`);

    // Calculate min and max values for y-axis
    const maxValue = Math.max(...groupedData.map(item => item[actualYKey]));
    const yAxisDomain = [0, Math.max(maxValue * 1.1, 0.0001)]; // Add 10% padding and ensure non-zero max

    const formatYAxis = (value: number) => {
      let digits = 0;
       
      if (maxValue > 1 && maxValue <= 20) 
        digits = 1
      else if (maxValue <= 1 && maxValue > 0.1)
        digits = 2
      else if (maxValue <= 0.1 && maxValue > 0.01)
        digits = 3
      else if (maxValue <= 0.01 && maxValue > 0.001)
        digits = 4
      else if (maxValue <= 0.001 && maxValue > 0.0001)
        digits = 5
        
      return value.toFixed(digits).replace(/\.?0+$/, '');  // Format to 3 decimal places
    };

    const tooltipFormatter = (value: number) => {
      let digits = 0;
       
      if (maxValue > 1 && maxValue <= 20) 
        digits = 1
      else if (maxValue <= 1 && maxValue > 0.1)
        digits = 2
      else if (maxValue <= 0.1 && maxValue > 0.01)
        digits = 3
      else if (maxValue <= 0.01 && maxValue > 0.001)
        digits = 4
      else if (maxValue <= 0.001 && maxValue > 0.0001)
        digits = 5
      return [formatNumber(value, digits), 'Value'];
    };

    const commonProps = {
      data: groupedData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xKey} 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
              ticks={xAxisTicks}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              domain={yAxisDomain}
              ticks={[0, yAxisDomain[1] * 0.25, yAxisDomain[1] * 0.5, yAxisDomain[1] * 0.75, yAxisDomain[1]]}
              allowDecimals={true}
            />
            <Tooltip 
              formatter={(value: number) => tooltipFormatter(value)}
              labelFormatter={formatTooltipDate}
            />
            <Line
              type="monotone"
              dataKey={actualYKey}
              stroke={color}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xKey} 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
              ticks={xAxisTicks}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              domain={yAxisDomain}
              ticks={[0, yAxisDomain[1] * 0.25, yAxisDomain[1] * 0.5, yAxisDomain[1] * 0.75, yAxisDomain[1]]}
              allowDecimals={true}
            />
            <Tooltip 
              formatter={(value: number) => tooltipFormatter(value)}
              labelFormatter={formatTooltipDate}
            />
            <Bar dataKey={actualYKey} fill={color} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Default to area chart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xKey} 
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12 }}
            ticks={xAxisTicks}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            domain={yAxisDomain}
            ticks={[0, yAxisDomain[1] * 0.25, yAxisDomain[1] * 0.5, yAxisDomain[1] * 0.75, yAxisDomain[1]]}
            allowDecimals={true}
          />
          <Tooltip 
            formatter={(value: number) => tooltipFormatter(value)}
            labelFormatter={formatTooltipDate}
          />
          <Area type="monotone" dataKey={actualYKey} fill={color} stroke={color} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => {
    console.log(`rendering loading skeleton`);
    return (
      <div className="w-full h-full flex flex-col relative">
        {/* Centered loading indicator */}
        {/* <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full" />
          <span className="text-sm font-medium text-muted-foreground">Loading data...</span>
        </div> */}

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg"/>
        </div>
        {/* Chart skeleton with shimmer effect */}
        <div className="w-full h-[80%] flex items-end justify-between opacity-50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full relative overflow-hidden rounded-t">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer"
                  style={{ 
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
                <Skeleton 
                  className="w-full" 
                  style={{ 
                    height: `${Math.random() * 60 + 20}%`,
                    backgroundColor: 'hsl(var(--muted))',
                    opacity: 0.8
                  }} 
                />
              </div>
              <Skeleton className="h-3 w-10 mt-2" />
            </div>
          ))}
        </div>
        
        {/* Y-axis labels skeleton */}
        <div className="w-full h-[20%] flex items-center justify-between mt-4 opacity-50">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Add keyframe animation for shimmer effect */}
        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}</style>
      </div>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    console.log(`rendering empty state`);
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-12 space-y-4">
        {emptyStateIcon ? (
          emptyStateIcon
        ) : (
          <div className="h-12 w-12 text-muted-foreground">
            {chartType === 'line' ? (
              <ChartSpline className="h-full w-full" />
            ) : chartType === 'bar' ? (
              <ChartColumnBig className="h-full w-full" />
            ) : (
              <ChartArea className="h-full w-full" />
            )}
          </div>
        )}
        <p className="text-muted-foreground text-center">
          {dateRange?.from || selectedDateButton !== '1M' 
            ? "No data available for the selected date range" 
            : emptyStateMessage}
        </p>
      </div>
    );
  };

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn("w-full", className)}>
        <CardHeader className={cn(
          showHeaderInVertical ? "gap-4" : "flex flex-col lg:flex-row flex-wrap items-start lg:items-center justify-between gap-4 pb-2"
        )}>
          <div className="flex flex-col gap-2">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            {showDateRange && (
              <DateRangePicker
                date={dateRange}
                onDateChange={onDateRangeChange}
              />
            )}
            {showDateButtons && (
              <Tabs
                value={selectedDateButton}
                onValueChange={handleDateButtonChange}
                className="w-fit"
              >
                <TabsList className="grid w-[135px] grid-cols-3">
                  <TabsTrigger value="1D">1D</TabsTrigger>
                  <TabsTrigger value="1W">1W</TabsTrigger>
                  <TabsTrigger value="1M">1M</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            {showChartTypeSelector && (
              <Tabs
                value={chartType}
                onValueChange={(v) => setChartType(v as 'line' | 'bar' | 'area')}
                className="w-fit"
              >
                <TabsList className="grid w-[150px] grid-cols-3">
                  <TabsTrigger value="line">Line</TabsTrigger>
                  <TabsTrigger value="bar">Bar</TabsTrigger>
                  <TabsTrigger value="area">Area</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div style={{ height }}>
            {isLoading ? (
              renderLoadingSkeleton()
            ) : (
              groupedData.length === 0 ? (
                renderEmptyState()
              ) : (
                renderChart()
              )
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 