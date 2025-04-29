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
import { subDays, subWeeks, subMonths, startOfDay, endOfDay, parseISO, isWithinInterval, format } from 'date-fns';
import { BarChart3, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
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
  formatter?: (value: number) => [string, string];
  isLoading?: boolean;
  emptyStateMessage?: string;
  emptyStateIcon?: React.ReactNode;
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
  formatter = (value: number) => [formatNumber(value), 'Value'],
  isLoading = false,
  emptyStateMessage = "No data available",
  emptyStateIcon,
}: DataChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('bar');
  const [selectedDateButton, setSelectedDateButton] = useState<string>('1M');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    return {
      from: subMonths(now, 1),
      to: now
    };
  });

  const actualYKey = yKey || dataKey || 'value';

  // Filter data based on date range
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!item[xKey]) return true;
      try {
        const itemDate = parseISO(item[xKey]);
        const start = startOfDay(dateRange.from ?? subDays(new Date(), 1));
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date());
        return isWithinInterval(itemDate, { start, end });
      } catch (error) {
        console.error('Error parsing date:', error);
        return false;
      }
    });
  }, [data, xKey, dateRange]);

  // Group data by day (default behavior)
  const groupedData = useMemo(() => {
    // Create a map to store aggregated values by day
    const dayMap = new Map<string, { [key: string]: any }>();

    filteredData.forEach(item => {
      try {
        const date = parseISO(item[xKey]);
        const dayKey = format(date, 'yyyy-MM-dd');
        
        if (!dayMap.has(dayKey)) {
          // Initialize with the first item's data
          dayMap.set(dayKey, {
            [xKey]: dayKey,
            [actualYKey]: 0
          });
        }
        
        // Add the value to the aggregated total
        const currentValue = dayMap.get(dayKey)![actualYKey];
        const itemValue = typeof item[actualYKey] === 'number' ? item[actualYKey] : 0;
        dayMap.get(dayKey)![actualYKey] = currentValue + itemValue;
      } catch (error) {
        console.error('Error processing date for grouping:', error);
      }
    });

    // Convert map to array and sort by date
    return Array.from(dayMap.values())
      .sort((a, b) => {
        const dateA = parseISO(a[xKey]);
        const dateB = parseISO(b[xKey]);
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredData, xKey, actualYKey]);

  const handleDateButtonChange = (value: string) => {
    setSelectedDateButton(value);
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

    setDateRange({
      from: start,
      to: now
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setSelectedDateButton('');
    if (range) {
      setDateRange(range);
    }
  };

  const formatXAxis = (date: string) => {
    try {
      return format(parseISO(date), 'MMM d');
    } catch (error) {
      return date;
    }
  };

  const formatTooltipDate = (date: string) => {
    try {
      return format(parseISO(date), 'MMM d, yyyy');
    } catch (error) {
      return date;
    }
  };

  const renderChart = () => {
    console.log(`rendering real chart`);
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
            />
            <YAxis tickFormatter={(value) => formatNumber(value)} />
            <Tooltip 
              formatter={(value: number) => formatter(value)}
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
            />
            <YAxis tickFormatter={(value) => formatNumber(value)} />
            <Tooltip 
              formatter={(value: number) => formatter(value)}
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
          />
          <YAxis tickFormatter={(value) => formatNumber(value)} />
          <Tooltip 
            formatter={(value: number) => formatter(value)}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full" />
          <span className="text-sm font-medium text-muted-foreground">Loading data...</span>
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
              <LineChart className="h-full w-full" />
            ) : chartType === 'bar' ? (
              <BarChart3 className="h-full w-full" />
            ) : (
              <PieChart className="h-full w-full" />
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
                onDateChange={handleDateRangeChange}
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