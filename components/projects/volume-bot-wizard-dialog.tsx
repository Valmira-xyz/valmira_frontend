import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Copy, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { BotService } from '@/services/botService';
import { projectService } from '@/services/projectService';
import { getWalletBalances } from '@/services/web3Utils';
import websocketService, { WebSocketEvents } from '@/services/websocketService';
import { toggleBot, updateVolumeGeneration } from '@/store/slices/botSlice';
import { fetchProject, fetchProjects } from '@/store/slices/projectSlice';
import { AppDispatch, RootState } from '@/store/store';
import { Project } from '@/types';

// Utility function for parsing error messages
const parseErrorMessage = (message: string, details: string) => {
  if (message.includes('insufficient funds')) {
    const addressMatch = details.match(/address (\w+)/);
    const availableMatch = details.match(/have (\d+)/);
    const requiredMatch = details.match(/want (\d+)/);

    const address = addressMatch ? addressMatch[1] : 'unknown';
    const available = availableMatch
      ? parseInt(availableMatch[1], 10) / 1e18
      : 0;
    const required = requiredMatch ? parseInt(requiredMatch[1], 10) / 1e18 : 0;
    const additionalNeeded = required - available;

    return {
      title: 'Insufficient Funds',
      message: `Your wallet ${address} has insufficient funds. Available: ${available.toFixed(6)} BNB, Required: ${required.toFixed(6)} BNB. Please add at least ${additionalNeeded.toFixed(6)} BNB to proceed.`,
    };
  }

  // Add more error parsing cases here as needed
  return { title: 'Error', message };
};

interface VolumeBotWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExtendedProject extends Project {
  addons: {
    VolumeBot: {
      _id?: string;
      isEnabled?: boolean;
      depositWalletId: {
        publicKey: string;
      };
      bnbBalance?: number;
      generatedVolume?: number;
    };
    [key: string]: any;
  };
  totalSupply?: string;
  tokenAddress: string;
  symbol: string;
  isImported?: boolean;
  explorerUrl?: string;
}

export function VolumeBotWizardDialog({
  open,
  onOpenChange,
}: VolumeBotWizardDialogProps) {
  const { id: projectId } = useParams() as { id: string };
  const { currentProject, loading: isProjectLoading } = useSelector(
    (state: RootState) => state.projects
  );
  const dispatch = useDispatch<AppDispatch>();

  // Initialize project state
  const [project, setProject] = useState<ExtendedProject | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(false);

  // Update local project state when currentProject changes
  useEffect(() => {
    if (!currentProject) return;

    setProject(currentProject as ExtendedProject);
  }, [currentProject]);

  // Fetch detailed project data when dialog opens
  useEffect(() => {
    if (open && projectId) {
      fetchAndFillDetailedProejct(projectId);
    }
  }, [open, projectId]);

  // Volume Bot Settings
  const [minBNBAmount, setMinBNBAmount] = useState(0.0001);
  const [maxBNBAmount, setMaxBNBAmount] = useState(0.0002);
  const [timeSpan, setTimeSpan] = useState(60000); // in milliseconds
  const [isLoading, setIsLoading] = useState(false);
  const [bnbBalance, setBnbBalance] = useState(0);
  const [errorState, setErrorState] = useState<
    | {
        message: string;
        details: string;
      }
    | undefined
  >(undefined);

  const loadBotConfiguration = async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const botDetails = await BotService.getBotById(
        project.addons.VolumeBot._id as string
      );

      console.log(`bot detail => ${JSON.stringify(botDetails, null, 2)}`);

      // Set the saved configuration values if available
      if (botDetails) {
        setMinBNBAmount(botDetails.minBnbAmount || 0.0001);
        setMaxBNBAmount(botDetails.maxBnbAmount || 0.0002);
        setTimeSpan((botDetails.timeSpanBetweenTransactions || 60000) / 1000);
        const balance = await getWalletBalances(
          [project.addons.VolumeBot.depositWalletId.publicKey],
          project.tokenAddress
        );
        if (balance && balance[0]) {
          setBnbBalance(balance[0].bnbBalance);
        }
      }
    } catch (error) {
      console.error('Error loading volume bot configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bot configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved configurations when dialog opens
  useEffect(() => {
    if (!open || !project?.addons?.VolumeBot?._id) return;

    loadBotConfiguration();
  }, [open, project?.addons?.VolumeBot?._id, toast]);

  // Add WebSocket listener for volume generation updates
  useEffect(() => {
    if (!projectId || !open) return;

    const handleVolumeGenerationUpdate = (data: {
      botId: string;
      generatedVolume: number;
      error?: {
        type: string;
        message: string;
        details: string;
        projectId?: string;
        volumeBotId?: string;
      };
    }) => {
      console.log('Received volume generation update:', data);
      if (data.error) {
        console.error('Volume generation error:', data.error);
        const { title, message } = parseErrorMessage(
          data.error.message,
          data.error.details
        );
        setErrorState({
          message: data.error.message,
          details: data.error.details,
        });
        toast({
          title,
          description: message,
          variant: 'destructive',
        });
      } else {
        console.log('Volume generated successfully:', data.generatedVolume);
        if (data.generatedVolume > 0) {
          dispatch(
            updateVolumeGeneration({
              projectId,
              botId: data.botId,
              generatedVolume: data.generatedVolume,
            })
          );

          // Update BNB balance after volume generation
          if (project?.addons?.VolumeBot?.depositWalletId?.publicKey) {
            getWalletBalances(
              [project.addons.VolumeBot.depositWalletId.publicKey],
              project.tokenAddress
            )
              .then((balances) => {
                if (balances && balances[0]) {
                  setBnbBalance(balances[0].bnbBalance);
                }
              })
              .catch((error) => {
                console.error('Error updating BNB balance:', error);
              });
          }

          toast({
            title: 'Volume Generated',
            description: `Successfully generated ${data.generatedVolume.toFixed(2)} volume`,
            variant: 'default',
          });
        }
      }
    };

    // Connect and join with error handling
    try {
      websocketService.connect();
      websocketService.joinProject(projectId);
      websocketService.subscribe(
        WebSocketEvents.VOLUME_GENERATION_UPDATED,
        handleVolumeGenerationUpdate
      );
    } catch (error) {
      console.error('WebSocket connection error:', error);
      toast({
        title: 'Connection Error',
        description:
          'Failed to establish WebSocket connection. Please try again.',
        variant: 'destructive',
      });
    }

    return () => {
      try {
        websocketService.unsubscribe(
          WebSocketEvents.VOLUME_GENERATION_UPDATED,
          handleVolumeGenerationUpdate
        );
        websocketService.leaveProject(projectId);
      } catch (error) {
        console.error('WebSocket cleanup error:', error);
      }
    };
  }, [projectId, open, dispatch, toast]);

  // Add error display component
  const ErrorDisplay = () => {
    if (!errorState) return null;

    const { title, message } = parseErrorMessage(
      errorState.message,
      errorState.details
    );

    return (
      <div className="mt-4 p-4 bg-gray-200 rounded-lg">
        <h4 className="text-destructive font-semibold mb-2">{title}</h4>
        <p className="text-sm text-destructive leading-relaxed">{message}</p>
      </div>
    );
  };

  const fetchAndFillDetailedProejct = async (projectId: string) => {
    try {
      setIsLoadingProject(true);
      const project = await projectService.getProject(projectId);
      setProject(project as ExtendedProject);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProject(false);
    }
  };

  const handleCopyAddress = async () => {
    if (project?.addons?.VolumeBot?.depositWalletId?.publicKey) {
      await navigator.clipboard.writeText(
        project.addons.VolumeBot.depositWalletId.publicKey
      );
      toast({
        title: 'Success',
        description: 'Wallet address copied to clipboard',
      });
    }
  };

  const handleExecute = async () => {
    if (!project?.addons?.VolumeBot?._id) {
      toast({
        title: 'Error',
        description:
          'Cannot execute: Invalid state or missing bot configuration',
        variant: 'destructive',
      });
      return;
    }

    setExecutionSuccess(false);
    setIsExecuting(true);

    try {
      // First configure the bot
      const result = await BotService.configureVolumeBot({
        projectId: project._id,
        botId: project.addons.VolumeBot._id,
        config: {
          minBNBAmount,
          maxBNBAmount,
          timeSpan: timeSpan * 1000,
        },
      });

      if (result.status === 'success') {
        // Then enable the bot through Redux
        setTimeout(() => {
          dispatch(fetchProject(projectId));
          dispatch(fetchProjects());
        }, 500);

        setIsExecuting(false);
        setExecutionSuccess(true);
        toast({
          title: 'Success',
          description:
            'Volume Bot configuration applied and started successfully',
        });
        setTimeout(() => {
          fetchAndFillDetailedProejct(projectId);
        }, 2000);
      } else {
        setIsExecuting(false);
        throw new Error(result.message || 'Configuration failed');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to configure Volume Bot',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStop = async () => {
    if (!project?.addons?.VolumeBot?._id) {
      toast({
        title: 'Error',
        description: 'Cannot stop: Invalid state or missing bot configuration',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);

    try {
      // Disable the bot through Redux
      await dispatch(
        toggleBot({
          projectId: project._id,
          botId: project.addons.VolumeBot._id,
          enabled: false,
        })
      ).unwrap();

      toast({
        title: 'Success',
        description: 'Volume Bot stopped successfully',
      });
      setTimeout(() => {
        fetchAndFillDetailedProejct(projectId);
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to stop Volume Bot',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  function abbreviateAddress(publicKey?: string): string {
    if (!publicKey) return '---';
    return publicKey.slice(0, 4) + '...' + publicKey.slice(-4);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        onOpenChange(false);
        setIsExecuting(false);
        setErrorState(undefined);
      }}
    >
      <DialogContent className="max-w-2xl">
        <Card className="border-none shadow-none">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle>Volume Bot Configuration</CardTitle>
            <CardDescription>
              Configure automated trading parameters to generate volume for your
              token.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wallet Information Section */}
            <div className="bg-secondary/30 p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Deposit Wallet</Label>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-mono bg-secondary/20 p-2 rounded">
                    {abbreviateAddress(
                      project?.addons?.VolumeBot?.depositWalletId?.publicKey
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyAddress}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <a
                    href={`https://bscscan.com/address/${project?.addons?.VolumeBot?.depositWalletId?.publicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    BNB Balance
                  </Label>
                  <p className="text-lg font-semibold">
                    {bnbBalance?.toFixed(6) || '0.000000'} BNB
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Generated Volume
                  </Label>
                  <p className="text-lg font-semibold">
                    $
                    {project?.addons?.VolumeBot?.generatedVolume?.toFixed(4) ||
                      '0.0000'}
                  </p>
                </div>
              </div>
            </div>

            {/* Min BNB Amount */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Min BNB Amount</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minBNBAmount}
                    onChange={(e) =>
                      setMinBNBAmount(parseFloat(e.target.value))
                    }
                    min={0.0001}
                    max={1.0}
                    step={0.001}
                    className="w-24 h-8 px-2 rounded-md border border-input bg-background text-sm"
                    disabled={isLoading || isExecuting}
                  />
                  <span className="text-sm font-medium">BNB</span>
                </div>
              </div>
              <Slider
                value={[minBNBAmount]}
                onValueChange={(value) => setMinBNBAmount(value[0])}
                min={0.0001}
                max={1.0}
                step={0.0001}
                className="w-full"
                disabled={isLoading || isExecuting}
              />
              <p className="text-sm text-muted-foreground">
                Minimum amount of BNB to use for each market making transaction
              </p>
            </div>

            {/* Max BNB Amount */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Max BNB Amount</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={maxBNBAmount}
                    onChange={(e) =>
                      setMaxBNBAmount(parseFloat(e.target.value))
                    }
                    min={0.0002}
                    max={2.0}
                    step={0.0002}
                    className="w-24 h-8 px-2 rounded-md border border-input bg-background text-sm"
                    disabled={isLoading || isExecuting}
                  />
                  <span className="text-sm font-medium">BNB</span>
                </div>
              </div>
              <Slider
                value={[maxBNBAmount]}
                onValueChange={(value) => setMaxBNBAmount(value[0])}
                min={0.0002}
                max={2.0}
                step={0.0002}
                className="w-full"
                disabled={isLoading || isExecuting}
              />
              <p className="text-sm text-muted-foreground">
                Maximum amount of BNB to use for each market making transaction
              </p>
            </div>

            {/* Time Span Between Transactions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Time Span Between Transactions</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={timeSpan}
                    onChange={(e) =>
                      setTimeSpan(parseFloat(e.target.value))
                    }
                    min={0.1}
                    max={600}
                    step={0.1}
                    className="w-24 h-8 px-2 rounded-md border border-input bg-background text-sm"
                    disabled={isLoading || isExecuting}
                  />
                  <span className="text-sm font-medium">s</span>
                </div>
              </div>
              <Slider
                value={[timeSpan]}
                onValueChange={(value) => setTimeSpan(value[0])}
                min={0.1}
                max={600}
                step={1}
                className="w-full"
                disabled={isLoading || isExecuting}
              />
              <p className="text-sm text-muted-foreground">
                Time interval between market making transactions
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-2">
              {project?.addons?.VolumeBot?.isEnabled || errorState ? (
                <Button
                  className="w-full"
                  onClick={handleStop}
                  disabled={isLoading}
                  variant="destructive"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Stop Bot'
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleExecute}
                  disabled={
                    isExecuting || isLoading || !project?.addons?.VolumeBot?._id
                  }
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isExecuting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying Configuration...
                    </>
                  ) : executionSuccess ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Apply & Start
                    </>
                  ) : (
                    'Apply & Start'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        {errorState && <ErrorDisplay />}
      </DialogContent>
    </Dialog>
  );
}
