'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ThemeToggleProps {
  className?: string;
  buttonProps?: Omit<ButtonProps, 'onClick' | 'children' | 'aria-label'>;
  tooltipContent?: React.ReactNode;
  onThemeChange?: (newTheme: 'light' | 'dark') => void;
}

export function ThemeToggle({
  className,
  buttonProps = { variant: 'ghost', size: 'icon' },
  tooltipContent = 'Toggle theme',
  onThemeChange,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            {...buttonProps}
            className={cn(buttonProps.className, className)}
            onClick={handleToggle}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {typeof tooltipContent === 'string' ? (
            <p>{tooltipContent}</p>
          ) : (
            tooltipContent
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
