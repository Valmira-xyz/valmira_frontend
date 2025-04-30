import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hasText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({ loading = true, size = 'md', className, hasText = true }: SpinnerProps) {
  if (!loading) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeMap[size], className)} />
      {hasText && <p className="text-muted-foreground">Loading data...</p>}
    </div>
  );
} 