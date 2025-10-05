// components/theme-switch.tsx

'use client';

import { useEffect, useState } from 'react';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as Switch from '@radix-ui/react-switch';

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return null;

  const isLight = theme === 'light';

  const toggleTheme = () => {
    setTheme(isLight ? 'dark' : 'light');
  };

  return (
    <Switch.Root
      checked={isLight}
      onCheckedChange={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center rounded-full bg-input transition-colors focus:outline-none"
    >
      <Switch.Thumb
        className={`absolute left-1 h-6 w-6 rounded-full bg-background shadow-md transform transition-transform duration-300 flex items-center justify-center
          ${isLight ? 'translate-x-6' : 'translate-x-0'}`}
      >
        {isLight ? (
          <Sun className="h-4 w-4 text-primary" />
        ) : (
          <Moon className="h-4 w-4 text-primary" />
        )}
      </Switch.Thumb>
    </Switch.Root>
  );
}
