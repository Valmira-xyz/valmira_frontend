import React, { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface Auditor {
  name: string;
  logo?: string;
  comingSoon?: boolean;
}

interface AuditCardProps {
  className?: string;
  auditors?: Auditor[];
}

export function AuditCard({ className, auditors = [] }: AuditCardProps) {
  const gridCols = Math.min(3, auditors.length || 3);
  const _gridClassName = cn('grid gap-4', {
    'grid-cols-1': gridCols === 1,
    'grid-cols-2': gridCols === 2,
    'grid-cols-3': gridCols === 3,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setIsNarrow(width < 290); // Adjust threshold as needed
    });

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={cardRef} className={cn('bg-muted rounded-lg w-full', className)}>
      <div className="px-4 py-6 sm:px-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          {/* Row: Title and Inline Button (flex layout) */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold font-tt break-words">
                Protected and Verified
              </h2>
            </div>

            {!isNarrow && (
              <div className="flex-shrink-0 self-start">
                <div className="px-3 py-2 text-sm font-medium bg-background dark:bg-accent-foreground dark:text-accent border border-foreground whitespace-nowrap rounded-md">
                  Audits
                </div>
              </div>
            )}
          </div>

          {/* Description always below heading + button */}
          <p className="text-muted-foreground text-sm">
            Security and transparency are at the core of everything we do.
          </p>

          {/* Optional mobile-style button */}
          {isNarrow && (
            <div className="self-start">
              <div className="px-3 py-2 text-sm font-medium bg-accent dark:bg-accent-foreground dark:text-accent border border-foreground whitespace-nowrap rounded-md">
                Audits
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="px-4 sm:px-6">
        <div className="h-px bg-foreground/10" />
      </div>

      {/* Auditors Section */}
      <div className="px-4 py-6 sm:px-6">
        <h3 className="text-sm font-medium mb-4">Auditors</h3>
        <div className={_gridClassName}>
          {(auditors.length
            ? auditors
            : [
                {
                  name: 'Code4rena',
                  logo: '/code4arenaSVG/code4rena-logomark.svg',
                  comingSoon: true,
                },
                // {
                //   name: 'and more',
                //   comingSoon: true,
                // },
              ]
          ).map((auditor, i) => (
            <div key={i} className="flex items-center gap-2">
              {auditor.comingSoon ? (
                <>
                  {auditor.logo ? (
                    <img
                      src={auditor.logo}
                      alt={auditor.name}
                      className="w-5 h-5 rounded"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-foreground/10 rounded" />
                  )}
                  <span className="text-sm font-medium break-words">
                    {auditor.name}
                  </span>
                  <span className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-200 text-yellow-800 font-semibold whitespace-nowrap min-w-[90px] text-center">
                    Coming Soon
                  </span>
                </>
              ) : (
                <>
                  {(() => {
                    console.log('auditor.logo:', auditor.logo);
                    return null;
                  })()}
                  {auditor.logo ? (
                    <img
                      src={auditor.logo}
                      alt={auditor.name}
                      className="w-5 h-5 rounded"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-foreground/20 rounded" />
                  )}
                  <span className="text-sm font-medium break-words">
                    {auditor.name}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
