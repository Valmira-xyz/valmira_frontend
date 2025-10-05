import React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
// import { BarChart3 } from 'lucide-react'; // You can swap this icon

interface ProjectCardProps {
  icon?: React.ReactNode;
  name: string;
  volume?: string;
  holders?: number;
  marketCap?: string;
  status?: string;
  description?: string;
  className?: string;
}

export function ProjectCard({
  icon = (
    <img
      src="/alphaProjectIcon.svg"
      alt="Project Logo"
      className="w-5 h-5 object-contain dark:invert"
    />
  ),
  name,
  volume,
  holders,
  marketCap,
  status,
  description,
  className,
}: ProjectCardProps) {
  return (
    <Card
      className={cn(
        'w-full h-[80px] rounded-xl flex justify-between items-center gap-2',
        className
      )}
    >
      <CardContent className="p-0 px-3 py-1.5 flex items-center gap-2">
        {/* Icon section */}
        <div className="flex-shrink-0">{icon}</div>

        {/* Text section */}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium leading-none">{name}</span>
          {status || description ? (
            <div className="flex flex-row items-center gap-2">
              {status && (
                <span className="text-xs px-0 py-0.5 rounded text-muted-foreground font-normal whitespace-nowrap min-w-[90px] text-center flex items-center gap-1">
                  {status}
                </span>
              )}
              {description && (
                <span className="text-xs text-muted-foreground leading-none">
                  {description}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground leading-none">
              Volume: {volume} | Holders: {holders?.toLocaleString()} | Market
              Cap: {marketCap}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
