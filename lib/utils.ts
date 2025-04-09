import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: value >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: value >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: 2,
  }).format(value);
}

export const generateAvatarColor = (address: string): string => {
  if (!address) return `hsl(0, 70%, 60%)`;

  const hash = address
    .toLowerCase()
    .split('')
    .reduce((a, b) => {
      return ((a << 5) - a + b.charCodeAt(0)) | 0;
    }, 0);

  return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
};

// Determine badge color based on status
export const getBadgeVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'warning';
    case 'Paused':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const genRandomSparklineData = (length: number) => {
  return Array.from({ length }, () => Math.floor(Math.random() * 100));
};
