// lib/fonts.ts
import localFont from 'next/font/local';

export const ttAutonomous = localFont({
  src: '../app/fonts/TTAutonomousVariable.ttf',
  variable: '--font-tt-autonomous',
  display: 'swap',
  preload: true,
  weight: '100 900',
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ],
});
