'use client';

import { useState } from 'react';
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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { subDays, subWeeks, subMonths, startOfDay, endOfDay, parseISO, isWithinInterval, format } from 'date-fns';

export interface DataChartProps {
  title: string;
  description?: string;
  data: any[];
  dataKey: string;
  color?: string;
  height?: number;
  showDateRange?: boolean;
  showDateButtons?: boolean;
  showChartTypeSelector?: boolean;
  showHeaderInVertical?: boolean;
  className?: string;
  formatter?: (value: number) => [string, string];
}

export function DataChart({
  title,
  description,
  data,
  dataKey,
  color = 'hsl(var(--primary))',
  height = 350,
  showDateRange = true,
  showDateButtons = true,
  showChartTypeSelector = true,
  showHeaderInVertical = false,
  className,
  formatter = (value: number) => [formatNumber(value), 'Value'],
}: DataChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area');
  const [selectedDateButton, setSelectedDateButton] = useState<string>('1D');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    return {
      from: subDays(now, 1),
      to: now
    };
  });

  // Filter and sort data based on date range
  const filteredData = data
    .filter((item) => {
      if (!item.date) return true;
      try {
        const itemDate = parseISO(item.date);
        const start = startOfDay(dateRange.from ?? subDays(new Date(), 1));
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date());
        return isWithinInterval(itemDate, { start, end });
      } catch (error) {
        console.error('Error parsing date:', error);
        return false;
      }
    })
    .sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    });

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
    const commonProps = {
      data: filteredData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
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
              dataKey={dataKey}
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
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
            />
            <YAxis tickFormatter={(value) => formatNumber(value)} />
            <Tooltip 
              formatter={(value: number) => formatter(value)}
              labelFormatter={formatTooltipDate}
            />
            <Bar dataKey={dataKey} fill={color} />
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
            dataKey="date" 
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12 }}
          />
          <YAxis tickFormatter={(value) => formatNumber(value)} />
          <Tooltip 
            formatter={(value: number) => formatter(value)}
            labelFormatter={formatTooltipDate}
          />
          <Area type="monotone" dataKey={dataKey} fill={color} stroke={color} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className={`${showHeaderInVertical ? "gap-4" : "flex flex-col md:flex-row items-start md:items-center justify-between pb-2"}`}>
        <div className="mb-4 md:mb-0 flex flex-col gap-2">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
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
        <div style={{ height }}>{renderChart()}</div>
      </CardContent>
    </Card>
  );
} 