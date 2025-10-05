import React, { ReactNode } from 'react';
import { TiTick } from 'react-icons/ti';

import { cn } from '@/lib/utils';

interface StepItem {
  stepNumber: string;
  title: string;
  description: string;
  items?: string[];
  actionElement: ReactNode;
}

interface StepperCardProps {
  steps: StepItem[];
  variant?: 'primary' | 'muted';
  className?: string;
}

export function StepperCard({
  steps,
  variant = 'primary',
  className,
}: StepperCardProps) {
  const cardStyles = cn(
    'rounded-lg shadow-sm w-full overflow-hidden',
    {
      'bg-primary text-primary-foreground': variant === 'primary',
      'bg-muted text-muted-foreground': variant === 'muted',
    },
    className
  );

  const numberCircleStyles = cn(
    'flex items-center justify-center w-6 h-6 rounded-sm text-sm font-bold shrink-0',
    {
      'bg-primary-foreground text-primary': variant === 'primary',
      'bg-primary text-primary-foreground': variant === 'muted',
    }
  );

  const dotStyles = cn('w-4 h-4 rounded-full shrink-0', {
    'bg-primary-foreground': variant === 'primary',
    'bg-background': variant === 'muted',
  });

  const descriptionStyles = cn(
    'text-lg',
    {
      'text-primary-foreground/80': variant === 'primary',
      'text-muted-foreground': variant === 'muted',
    },
    'line-clamp-2'
  );

  const itemTextStyles = cn('text-sm', {
    'text-primary-foreground/80': variant === 'primary',
    'text-muted-foreground': variant === 'muted',
  });

  return (
    <div className={cardStyles}>
      {steps.map((step, index) => (
        <React.Fragment key={step.stepNumber}>
          <div className="p-6">
            <div className="flex flex-col gap-3">
              {' '}
              {/* smaller gap here */}
              {/* Step number + title + action */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-2">
                {/* Left: number + title + description */}
                <div className="flex flex-col gap-y-1">
                  <div className="flex items-start gap-3">
                    <div className={`${numberCircleStyles} font-tt`}>
                      {step.stepNumber}
                    </div>
                    <h3 className="text-lg font-semibold font-tt mt-[2px]">
                      {step.title}
                    </h3>
                  </div>
                  <p className={descriptionStyles}>{step.description}</p>{' '}
                  {/* ⬅️ pulled closer */}
                </div>

                {/* Right: button or action */}
                <div className="self-start">{step.actionElement}</div>
              </div>
              {/* Bullet Items */}
              {step.items && step.items.length > 0 && (
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {step.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-2">
                      <span
                        className={
                          dotStyles + ' flex items-center justify-center'
                        }
                      >
                        <TiTick className="w-4 h-4 text-primary" />
                      </span>
                      <span className={itemTextStyles}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Divider between steps */}
          {index < steps.length - 1 && (
            <div className="px-6">
              <div className="h-px bg-primary-foreground/10" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
