import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  const absNum = Math.abs(num)
  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(1) + "B"
  } else if (absNum >= 1e6) {
    return (num / 1e6).toFixed(1) + "M"
  } else if (absNum >= 1e3) {
    return (num / 1e3).toFixed(1) + "k"
  } else {
    return num.toString()
  }
}

