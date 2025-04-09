import { Copy, ExternalLink } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { generateAvatarColor, getBadgeVariant } from '@/lib/utils';
import { ProjectHeaderProps } from '@/types';

import { Button } from '../ui/button';

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const { toast } = useToast();
  if (!project) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="mt-2 h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="mt-4 flex justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Address copied',
      description: 'Token address has been copied to clipboard',
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback
                style={{
                  backgroundColor: generateAvatarColor(
                    typeof project.owner === 'string'
                      ? project.owner
                      : project.owner.walletAddress
                  ),
                }}
              >
                {typeof project.owner === 'string'
                  ? project.owner.slice(2, 4).toUpperCase()
                  : project.owner.walletAddress.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {project.name || 'Untitled Project'}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {project?.chainId && (
                  <img
                    src={`/blockchain-icons/${project.chainId}.svg`}
                    alt={project.chainId.toString()}
                    className="h-4 w-4"
                  />
                )}
                <span>{project.tokenAddress || 'No token address'}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    copyToClipboard(project.tokenAddress || 'No token address')
                  }
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy address</span>
                </Button>

                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a
                    href={`https://bscscan.com/address/${project.tokenAddress || 'No token address'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View on Explorer</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
          <Badge
            variant={getBadgeVariant(project.status)}
            className="font-medium text-sm px-3 py-1 rounded-full"
          >
            {project.status}
          </Badge>
        </div>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          {/* <span>Connected Wallet: {walletAddress || "Not connected"}</span> */}
          <span>
            Last Updated:{' '}
            {project.updatedAt
              ? new Date(project.updatedAt).toLocaleString()
              : 'Never'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
