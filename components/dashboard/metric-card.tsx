import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: 'increasing' | 'decreasing' | 'stable';
  changePercent?: number;
  isLoading?: boolean;
  valuePrefix?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  changePercent = 0,
  isLoading,
  valuePrefix = '',
  className,
}: MetricCardProps) {
  return (
    <Card
      className={`relative overflow-hidden max-w-[200px] w-full ${className} ${
        isLoading ? 'opacity-60' : ''
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <CardTitle className="text-xs font-normal">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {valuePrefix}
              {formatNumber(Number(value))}
            </div>
            {trend && trend !== 'stable' && (
              <div className={`text-xs mt-1 text-gray-500`}>
                {trend === 'increasing' ? '+' : '-'} {changePercent}%
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
