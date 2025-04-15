'use client';

import type { DateRange } from 'react-day-picker';

import { subDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';

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
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter('1d')}
              className={
                dateRange?.from &&
                dateRange.to &&
                Math.round(
                  (dateRange.to.getTime() - dateRange.from.getTime()) /
                    (1000 * 60 * 60 * 24)
                ) === 1
                  ? 'bg-primary text-primary-foreground'
                  : ''
              }
            >
              1D
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter('7d')}
              className={
                dateRange?.from &&
                dateRange.to &&
                Math.round(
                  (dateRange.to.getTime() - dateRange.from.getTime()) /
                    (1000 * 60 * 60 * 24)
                ) === 7
                  ? 'bg-primary text-primary-foreground'
                  : ''
              }
            >
              1W
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter('1m')}
              className={
                dateRange?.from &&
                dateRange.to &&
                Math.round(
                  (dateRange.to.getTime() - dateRange.from.getTime()) /
                    (1000 * 60 * 60 * 24)
                ) === 30
                  ? 'bg-primary text-primary-foreground'
                  : ''
              }
            >
              1M
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter('ytd')}
              className={
                dateRange?.from &&
                dateRange.from.getFullYear() === today.getFullYear() &&
                dateRange.from.getMonth() === 0 &&
                dateRange.from.getDate() === 1
                  ? 'bg-primary text-primary-foreground'
                  : ''
              }
            >
              YTD
            </Button>
          </div>
          <div className="ml-auto">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
