'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ProjectCostEstimator() {
  const [count, setCount] = useState(2);
  const amount = 0; // Replace with actual calculation

  return (
    <Card className="p-6 space-y-4 rounded-xl shadow-md w-full max-w-3xl">
      {/* Number of Projects */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Number of project</h3>
          <p className="text-sm text-muted-foreground">
            Based on your selections and usage
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-md w-8 h-8"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
          >
            –
          </Button>
          <span className="text-lg font-semibold">{count}</span>
          <Button
            variant="outline"
            size="icon"
            className="rounded-md w-8 h-8"
            onClick={() => setCount((c) => c + 1)}
          >
            +
          </Button>
        </div>
      </div>

      <hr />

      {/* Total of Projects */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-bold">Total of {count} Projects</h3>
          <p className="text-sm text-muted-foreground">Combine monthly cost</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">${amount}</p>
          <p className="text-sm text-muted-foreground">/ Month Total</p>
        </div>
      </div>

      <hr />

      {/* Estimated Monthly Cost */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-bold">Estimated Monthly Cost</h3>
          <p className="text-sm text-muted-foreground">
            Based on your selections and usage
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">${amount}</p>
          <p className="text-sm text-muted-foreground">/ Month per project</p>
        </div>
      </div>

      <hr />

      {/* Annual Estimate */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-bold">Annual Estimate</h3>
          <p className="text-sm text-muted-foreground">Combine monthly cost</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">${amount}</p>
          <p className="text-sm text-muted-foreground">/ Month per project</p>
        </div>
      </div>
    </Card>
  );
}
