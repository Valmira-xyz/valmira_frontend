'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-4">Please try refreshing the page</p>
      <div className="flex gap-4">
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Refresh Page
        </Button>
        <Button
          onClick={() => reset()}
          variant="default"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
} 