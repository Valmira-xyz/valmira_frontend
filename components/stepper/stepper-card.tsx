import React, { ReactNode } from 'react';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils'; // Assuming you have a utility for class names

interface StepperCardProps {
  stepNumber: string;
  title: string;
  description: string;
  items?: string[];
  actionElement: ReactNode;
  variant?: 'primary' | 'muted';
  className?: string;
}

export function StepperCard({
  stepNumber,
  title,
  description,
  items,
  actionElement,
  variant = 'primary',
  className,
}: StepperCardProps) {
  const cardStyles = cn(
    'p-4 lg:p-6 rounded-lg shadow-sm flex flex-col items-start gap-6 w-full',
    {
      'bg-primary text-primary-foreground': variant === 'primary',
      'bg-muted text-muted-foreground': variant === 'muted', // Style for muted variant
      // Add other variant styles here
    },
    className
  );

  const numberCircleStyles = cn(
    'flex items-center justify-center w-6 h-6 rounded-sm text-xs font-bold shrink-0',
    {
      'bg-primary-foreground text-primary': variant === 'primary',
      'bg-primary text-primary-foreground': variant === 'muted', // Adjust for contrast
    }
  );

  const checkBackgroundStyles = cn(
    'flex items-center justify-center w-3 h-3 rounded-full shrink-0',
    {
      'bg-background': variant === 'primary' || variant === 'muted',
    }
  );

  const checkIconStyles = cn('w-1.5 h-1.5', {
    'text-primary': variant === 'primary',
    'text-muted-foreground': variant === 'muted', // Adjust check color for muted
  });

  const descriptionStyles = cn('text-sm', {
    'text-primary-foreground/80': variant === 'primary',
    'text-muted-foreground': variant === 'muted',
  });

  const itemTextStyles = cn('text-xs', {
    'text-primary-foreground/80': variant === 'primary',
    'text-muted-foreground': variant === 'muted',
  });

  return (
    <div className={cardStyles}>
      <div className="flex flex-col items-start gap-4 w-full">
        <div className="flex items-start justify-between gap-2 w-full">
          <div className="flex flex-col items-start gap-2 w-full">
            <div className="flex items-start gap-3 w-full">
              <div className={numberCircleStyles}>{stepNumber}</div>
              <h3 className="text-base font-semibold">{title}</h3>
            </div>

            <p className={descriptionStyles}>{description}</p>
          </div>
          <div className="hidden xl:block">{actionElement}</div>
        </div>

        {items && items.length > 0 && (
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2 w-full">
            {items.map((item, index) => (
              <div key={index} className="inline-flex items-center gap-1.5">
                <div className={checkBackgroundStyles}>
                  <Check className={checkIconStyles} />
                </div>
                <span className={itemTextStyles}>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="xl:hidden mt-auto">{actionElement}</div>
    </div>
  );
}
