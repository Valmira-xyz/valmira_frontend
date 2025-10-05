'use client';

import * as React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GoogleDriveVideoPlayerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Google Drive link or file ID */
  driveLink: string;
  /** Video title for accessibility and display */
  title?: string;
  /** Optional description */
  description?: string;
  /** Show title and description (default: false for cleaner look) */
  showInfo?: boolean;
  /** Wrap in card (default: true) */
  showCard?: boolean;
}

const GoogleDriveVideoPlayer = React.forwardRef<
  HTMLDivElement,
  GoogleDriveVideoPlayerProps
>(
  (
    {
      className,
      driveLink,
      title = 'Video Tutorial',
      description,
      showInfo = false,
      showCard = true,
      ...props
    },
    ref
  ) => {
    const getFileIdFromLink = (link: string): string | null => {
      // Handle both full URLs and file IDs
      if (link.includes('drive.google.com')) {
        const match = link.match(/d\/(.*?)\//) || link.match(/id=([^&]+)/);
        return match ? match[1] : null;
      }
      // If it's already a file ID, return as is
      return link;
    };

    const fileId = getFileIdFromLink(driveLink);

    if (!fileId) {
      const errorContent = (
        <div
          className={cn(
            'w-full aspect-video bg-muted flex items-center justify-center rounded-lg',
            className
          )}
        >
          <p className="text-destructive">
            Invalid Google Drive link provided.
          </p>
        </div>
      );

      return showCard ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">{errorContent}</CardContent>
        </Card>
      ) : (
        errorContent
      );
    }

    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

    const videoContent = (
      <div
        ref={ref}
        className={cn(
          'w-full aspect-video rounded-lg overflow-hidden',
          className
        )}
        {...props}
      >
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={title}
          className="border-0"
        />

        {/* Video Info */}
        {showInfo && (title || description) && (
          <div className="p-4">
            {title && <h3 className="font-semibold text-lg mb-1">{title}</h3>}
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>
        )}
      </div>
    );

    return showCard ? (
      <Card className="overflow-hidden">
        <CardContent className="p-0">{videoContent}</CardContent>
      </Card>
    ) : (
      videoContent
    );
  }
);

GoogleDriveVideoPlayer.displayName = 'GoogleDriveVideoPlayer';

// Video section component for organizing multiple videos
interface VideoSectionProps {
  title: string;
  description?: string;
  videos: Array<{
    driveLink: string;
    title: string;
    description?: string;
  }>;
  layout?: 'single' | 'grid' | 'list';
  showInfo?: boolean;
}

export function VideoSection({
  title,
  description,
  videos,
  layout = 'single',
  showInfo = false,
}: VideoSectionProps) {
  const getGridClass = () => {
    switch (layout) {
      case 'grid':
        return 'grid gap-6 md:grid-cols-2';
      case 'list':
        return 'space-y-6';
      default:
        return 'space-y-6';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <div className={getGridClass()}>
        {videos.map((video, index) => (
          <GoogleDriveVideoPlayer
            key={index}
            driveLink={video.driveLink}
            title={video.title}
            description={video.description}
            showInfo={showInfo}
          />
        ))}
      </div>
    </div>
  );
}

export { GoogleDriveVideoPlayer };
