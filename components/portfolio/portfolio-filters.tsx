'use client';

import type { DateRange } from 'react-day-picker';

import { subDays } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { TabsList } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface PortfolioFiltersProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function PortfolioFilters({
  dateRange,
  onDateRangeChange,
}: PortfolioFiltersProps) {
  const today = new Date();

  const handleQuickFilter = (filter: '1d' | '7d' | '1m' | 'ytd') => {
    switch (filter) {
      case '1d':
        onDateRangeChange({
          from: subDays(today, 1),
          to: today,
        });
        break;
      case '7d':
        onDateRangeChange({
          from: subDays(today, 7),
          to: today,
        });
        break;
      case '1m':
        onDateRangeChange({
          from: subDays(today, 30),
          to: today,
        });
        break;
      case 'ytd':
        onDateRangeChange({
          from: new Date(today.getFullYear(), 0, 1),
          to: today,
        });
        break;
    }
  };

  return (
    <Card className="w-full md:w-auto">
      <CardContent className="p-0 md:p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
          <div className="shrink-0 w-full md:w-auto">
            <DateRangePicker
              className="w-full md:w-auto"
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
            />
          </div>
          <TabsList>
            <div
              // variant="ghost"
              // size="sm"
              onClick={() => handleQuickFilter('1d')}
              className={cn(
                'cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                dateRange?.from &&
                  dateRange.to &&
                  Math.round(
                    (dateRange.to.getTime() - dateRange.from.getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) === 1
                  ? 'bg-background text-foreground shadow-sm'
                  : ''
              )}
            >
              1D
            </div>
            <div
              // variant="ghost"
              // size="sm"
              onClick={() => handleQuickFilter('7d')}
              className={cn(
                'cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ',
                dateRange?.from &&
                  dateRange.to &&
                  Math.round(
                    (dateRange.to.getTime() - dateRange.from.getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) === 7
                  ? 'bg-background text-foreground shadow-sm'
                  : ''
              )}
            >
              1W
            </div>
            <div
              // variant="ghost"
              // size="sm"
              onClick={() => handleQuickFilter('1m')}
              className={cn(
                'cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ',
                dateRange?.from &&
                  dateRange.to &&
                  Math.round(
                    (dateRange.to.getTime() - dateRange.from.getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) === 30
                  ? 'bg-background text-foreground shadow-sm'
                  : ''
              )}
            >
              1M
            </div>
            <div
              // variant="ghost"
              // size="sm"
              onClick={() => handleQuickFilter('ytd')}
              className={cn(
                'cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ',
                dateRange?.from &&
                  dateRange.from.getFullYear() === today.getFullYear() &&
                  dateRange.from.getMonth() === 0 &&
                  dateRange.from.getDate() === 1
                  ? 'bg-background text-foreground shadow-sm'
                  : ''
              )}
            >
              YTD
            </div>
          </TabsList>
        </div>
      </CardContent>
    </Card>
  );
}
