import React, { useEffect, useRef, useState } from 'react';
import { LiaTelegram } from 'react-icons/lia';

import { cn } from '@/lib/utils';

interface Project {
  name: string;
  logo?: string;
}

interface ProjectCardProps {
  className?: string;
  projects?: Project[];
}

export function UseCaseCard({ className, projects = [] }: ProjectCardProps) {
  const gridCols = Math.min(3, projects.length || 3);
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
        <div className="flex flex-col gap-4">
          {/* Header row with smart wrapping */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold mb-1 font-tt break-words">
                Launched with Valmira
              </h2>
            </div>
            {!isNarrow && (
              <div className="flex-shrink-0 self-start">
                <div className="px-3 py-2 text-sm font-medium bg-background dark:bg-accent-foreground dark:text-accent border border-foreground whitespace-nowrap rounded-md">
                  See use case
                </div>
              </div>
            )}
          </div>

          {/* Description below heading + button */}
          <p className="text-muted-foreground text-sm">
            See how other real projects used the platform to run their launches.
          </p>

          {/* Mobile-only button when width is small */}
          {isNarrow && (
            <div className="self-start">
              <div className="px-3 py-2 text-sm font-medium bg-accent dark:bg-accent-foreground dark:text-accent border border-foreground whitespace-nowrap rounded-md">
                See use case
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="px-4 sm:px-6">
        {/* uncomment this after launch when we have some Projects to showcase */}
        <div className="h-px bg-foreground/10" />
      </div>

      {/* Project card */}
      <div className="my-2 px-4 h-[80px] flex items-center justify-center">
        {/* uncomment this after launch when we have some Projects to showcase */}
        {/* <ProjectCard
          name="Project Alpha"
          status="Launching soon"
          description="First pilot project"
        /> */}

        {/* Temporary Telegram bot link until we have projects to showcase */}
        <div className="flex items-center justify-center gap-2 p-2 w-full bg-background rounded-lg border border-foreground/10">
          <div
            className="flex items-center gap-2 justify-center cursor-pointer"
            onClick={() =>
              window.open('https://t.me/valmira_multichain_bot', '_blank')
            }
          >
            <LiaTelegram className="w-5 h-5" />
            <span className="text-sm font-medium">Join Our TG Bot</span>
            {/* <Button
              variant="outline"
              size="sm"
              className="text-xs px-1 py-1 h-6"
              
            >
              @valmira_multichain_bot
            </Button> */}
            <span>🚀</span>
          </div>
        </div>
      </div>

      {/* Optional grid of projects (if needed) */}
      {/* <div className="px-4 py-6 sm:px-6 bg-white">
        <h3 className="text-sm font-medium mb-4">Projects</h3>
        <div className={_gridClassName}>
          {projects.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 bg-foreground/20 rounded" />
              <span className="text-sm font-medium">{p.name}</span>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}
