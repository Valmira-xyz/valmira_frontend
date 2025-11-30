import { useState } from 'react';

import { Copy, ExternalLink, LineChart } from 'lucide-react';

import { ProjectActivationModal } from '@/components/projects/project-activation-modal';
import { ProjectRefreshButton } from '@/components/projects/project-refresh-button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { generateAvatarColor, getBadgeVariant } from '@/lib/utils';

import { Button } from '../ui/button';

export const ProjectHeader: React.FC<{
  project?: any;
  onProjectUpdate?: () => void;
}> = ({ project, onProjectUpdate }) => {
  const { toast } = useToast();
  const [showActivationModal, setShowActivationModal] = useState(false);

  if (!project) {
    return (
      <Card className="border">
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

  const truncateAddress = (address: string, startChars = 6, endChars = 4) => {
    if (!address || address === 'No token address') return address;
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  };

  const handleActivateProject = () => {
    setShowActivationModal(true);
  };

  const handleActivationSuccess = () => {
    if (onProjectUpdate) {
      onProjectUpdate();
    }
  };

  return (
    <>
      <Card className="bg-muted">
        <CardContent className="p-6">
          <div className="flex items-start sm:items-center justify-between flex-wrap gap-4">
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
                <h1 className="text-lg font-bold">
                  {project.name || 'Untitled Project'}
                </h1>
                <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    {project?.chainName && (
                      <img
                        src={`/blockchain-icons/${project.chainName}.svg`}
                        alt={project.chainName}
                        className="h-4 w-4"
                      />
                    )}
                    <span className="font-mono">
                      <span className="hidden sm:inline">
                        {project.tokenAddress || 'No token address'}
                      </span>
                      <span className="sm:hidden">
                        {truncateAddress(
                          project.tokenAddress || 'No token address'
                        )}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]"
                      onClick={() =>
                        copyToClipboard(
                          project.tokenAddress || 'No token address'
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy address</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]"
                      asChild
                    >
                      <a
                        href={`https://${
                          project?.chainName === 'BSC_MAINNET'
                            ? 'bscscan.com'
                            : project?.chainName === 'ETH_MAINNET'
                              ? 'etherscan.io'
                              : project?.chainName === 'SOMNIA_TESTNET'
                                ? 'shannon-explorer.somnia.network'
                                : project?.chainName === 'SOMNIA_MAINNET'
                                  ? 'explorer.somnia.network'
                                  : 'solscan.io'
                        }/token/${project.tokenAddress || 'No token address'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View on Explorer</span>
                      </a>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]"
                      asChild
                    >
                      <a
                        href={`https://dexscreener.com/${project?.chainName === 'BSC_MAINNET' ? 'bsc' : project?.chainName === 'ETH_MAINNET' ? 'ethereum' : 'solana'}/${project.tokenAddress || 'No token address'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LineChart className="h-4 w-4" />
                        <span className="sr-only">View on Dexscreener</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-end min-w-0">
              <div className="[&>button]:px-2 [&>button]:py-1.5 sm:[&>button]:px-3 sm:[&>button]:py-2">
                <ProjectRefreshButton projectId={project._id} />
              </div>
              {project.status === 'inactive' ? (
                <Button
                  onClick={handleActivateProject}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg whitespace-nowrap text-sm"
                >
                  Activate Project
                </Button>
              ) : (
                <Badge
                  variant={getBadgeVariant(project.status)}
                  className="font-medium text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1 rounded-full whitespace-nowrap"
                >
                  {project.status}
                </Badge>
              )}
            </div>
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

      <ProjectActivationModal
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
        project={project}
        onActivationSuccess={handleActivationSuccess}
      />
    </>
  );
};
