import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Auditor {
  name: string;
  logo?: string;
}

interface AuditCardProps {
  className?: string;
  auditors?: Auditor[];
}

export function AuditCard({ className, auditors = [] }: AuditCardProps) {
  // Calculate grid columns based on number of auditors
  const gridCols = Math.min(3, auditors.length || 3); // Max 3 columns, min 1
  const gridClassName = cn('grid gap-4', {
    'grid-cols-1': gridCols === 1,
    'grid-cols-2': gridCols === 2,
    'grid-cols-3': gridCols === 3,
  });

  return (
    <div className={cn('bg-muted rounded-lg w-full min-w-[320px]', className)}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">
              Protected and Verified
            </h2>
            <p className="text-muted-foreground text-sm">
              Over $4M invested in security, including audits, and expert
              reviews
            </p>
          </div>
          <div>
            <Button variant="default" size="lg">
              Audits
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6">
        <div className="h-px bg-foreground/10" />
      </div>

      <div className="p-6">
        <h3 className="text-sm font-medium mb-4">Auditors</h3>
        <div className={gridClassName}>
          {(auditors.length
            ? auditors
            : [
                { name: 'logoipsum' },
                { name: 'logoipsum' },
                { name: 'logoipsum' },
              ]
          ).map((auditor, i) => (
            <div key={i} className="h-8 flex items-center">
              <div className="flex items-center gap-2">
                {auditor.logo ? (
                  <img
                    src={auditor.logo}
                    alt={auditor.name}
                    className="w-5 h-5 rounded"
                  />
                ) : (
                  <div className="w-5 h-5 bg-foreground/20 rounded" />
                )}
                <span className="text-sm font-medium">{auditor.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
