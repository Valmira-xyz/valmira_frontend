'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumber } from '@/lib/utils';

interface PortfolioChartProps {
  dateRange: DateRange | undefined;
  metric: 'profit' | 'volume' | 'trades' | 'combined';
  height?: number;
}

// Mock data that will definitely render
const mockData = [
  { name: 'Jan', profit: 4000, volume: 240000, trades: 240 },
  { name: 'Feb', profit: 3000, volume: 198000, trades: 210 },
  { name: 'Mar', profit: 5000, volume: 280000, trades: 250 },
  { name: 'Apr', profit: 2780, volume: 308000, trades: 290 },
  { name: 'May', profit: 1890, volume: 248000, trades: 230 },
  { name: 'Jun', profit: 2390, volume: 380000, trades: 310 },
  { name: 'Jul', profit: 3490, volume: 430000, trades: 340 },
];

export function PortfolioChart({
  dateRange,
  metric,
  height = 350,
}: PortfolioChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area');
  console.log(dateRange);
  // Determine chart title and description based on metric
  const chartConfig = {
    profit: {
      title: 'Profit Trend',
      description: 'Daily profit across all projects',
      dataKey: 'profit',
      color: 'hsl(var(--chart-1))',
      formatter: (value: number) => [`$${formatNumber(value)}`, 'Profit'],
    },
    volume: {
      title: 'Trading Volume',
      description: 'Daily trading volume across all projects',
      dataKey: 'volume',
      color: 'hsl(var(--chart-2))',
      formatter: (value: number) => [`$${formatNumber(value)}`, 'Volume'],
    },
    trades: {
      title: 'Trading Activity',
      description: 'Number of trades executed',
      dataKey: 'trades',
      color: 'hsl(var(--chart-3))',
      formatter: (value: number) => [`${formatNumber(value)}`, 'Trades'],
    },
    combined: {
      title: 'Portfolio Performance',
      description: 'Combined metrics across all projects',
      dataKey: 'profit',
      color: 'hsl(var(--chart-1))',
      formatter: (value: number) => [`$${formatNumber(value)}`, 'Profit'],
    },
  };

  const renderChart = () => {
    const dataKey = chartConfig[metric].dataKey;
    const color = chartConfig[metric].color;

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              activeDot={{ r: 8 }}
            />
            {metric === 'combined' && (
              <>
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="hsl(var(--chart-2))"
                  activeDot={{ r: 8 }}
                  yAxisId="right"
                />
                <YAxis yAxisId="right" orientation="right" />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Default to area chart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => formatNumber(Number(value))} />
          <Area type="monotone" dataKey={dataKey} fill={color} stroke={color} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="border">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2">
        <div className="mb-4 md:mb-0">
          <CardTitle className="text-[16px] tracking-wide font-bold">
            {chartConfig[metric].title}
          </CardTitle>
          <CardDescription>{chartConfig[metric].description}</CardDescription>
        </div>
        {
          <Tabs
            value={chartType}
            onValueChange={(v) => setChartType(v as 'line' | 'bar' | 'area')}
          >
            <TabsList className="grid w-[180px] grid-cols-3">
              <TabsTrigger value="line">Line</TabsTrigger>
              <TabsTrigger value="bar">Bar</TabsTrigger>
              <TabsTrigger value="area">Area</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      </CardHeader>
      <CardContent className="p-4">
        <div style={{ height: height || 350 }}>{renderChart()}</div>
      </CardContent>
    </Card>
  );
}
