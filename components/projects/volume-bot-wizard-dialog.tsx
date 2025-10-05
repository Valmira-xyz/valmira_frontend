import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Loader2, RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { BotService } from '@/services/botService';
import websocketService, { WebSocketEvents } from '@/services/websocketService';
import { toggleBot, updateVolumeGeneration } from '@/store/slices/botSlice';
import { fetchProject, fetchProjects } from '@/store/slices/projectSlice';
import { AppDispatch, RootState } from '@/store/store';
import { Project } from '@/types';

// Utility function for parsing error messages
const parseErrorMessage = (
  message: string,
  details: string,
  nativeCurrency: string
) => {
  console.log('parsing error message - native currency : ', nativeCurrency);
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
      message: `Your wallet ${address} has insufficient funds. Available: ${available.toFixed(6)} ${nativeCurrency}, Required: ${required.toFixed(6)} ${nativeCurrency}. Please add at least ${additionalNeeded.toFixed(6)} ${nativeCurrency} to proceed.`,
    };
  }

  // Add more error parsing cases here as needed
  return { title: 'Error', message };
};

interface VolumeBotWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationSuccess?: () => void;
}

interface ExtendedProject extends Project {
  addons: {
    VolumeBot: {
      _id?: string;
      isEnabled?: boolean;
      depositWalletId: {
        publicKey: string;
      };
      nativeBalance?: number;
      generatedVolume?: number;
    };
    [key: string]: any;
  };
  totalSupply?: string;
  tokenAddress: string;
  symbol: string;
  isImported?: boolean;
  explorerUrl?: string;
  chainName: string;
}

export function VolumeBotWizardDialog({
  open,
  onOpenChange,
  onConfigurationSuccess,
}: VolumeBotWizardDialogProps) {
  const { id: projectId } = useParams() as { id: string };
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const dispatch = useDispatch<AppDispatch>();

  // Initialize project state
  const [project, setProject] = useState<ExtendedProject | null>(null);
  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(false);

  // Update local project state when currentProject changes
  useEffect(() => {
    if (!currentProject) return;
    setProject(currentProject as ExtendedProject);
  }, [currentProject]);

  // Volume Bot Settings
  const [minNativeAmount, setMinNativeAmount] = useState(0.0001);
  const [maxNativeAmount, setMaxNativeAmount] = useState(0.0002);
  const [timeSpan, setTimeSpan] = useState(3); // in seconds
  const [isLoading, setIsLoading] = useState(false);

  const nativeCurrency =
    project?.chainName === 'BSC_MAINNET'
      ? 'BNB'
      : project?.chainName === 'ETH_MAINNET'
        ? 'ETH'
        : 'SOL';
  const loadBotConfiguration = async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const botDetails = await BotService.getBotById(
        project.addons.VolumeBot._id as string
      );

      // Set the saved configuration values if available
      if (botDetails) {
        setMinNativeAmount(botDetails.minNativeAmount || 0.0001);
        setMaxNativeAmount(botDetails.maxNativeAmount || 0.0002);
        setTimeSpan(
          botDetails.timeSpanBetweenTransactions
            ? botDetails.timeSpanBetweenTransactions / 1000 // for converting milliseconds to seconds
            : 3
        );
      }
    } catch (error: any) {
      console.error('Error loading volume bot configuration:', error);
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to load bot configuration',
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

        // Get native currency from currentProject instead of project state
        const errorNativeCurrency =
          currentProject?.chainName === 'BSC_MAINNET'
            ? 'BNB'
            : currentProject?.chainName === 'ETH_MAINNET'
              ? 'ETH'
              : 'SOL';

        const { title, message } = parseErrorMessage(
          data.error.message,
          data.error.details,
          errorNativeCurrency
        );

        // Update local state to disable the bot
        setProject((prevProject) => {
          if (!prevProject) return null;
          return {
            ...prevProject,
            addons: {
              ...prevProject.addons,
              VolumeBot: {
                ...prevProject.addons.VolumeBot,
                isEnabled: false,
              },
            },
          };
        });

        // Update Redux state to disable the bot
        dispatch(
          toggleBot({
            projectId,
            botId: data.botId,
            enabled: false,
          })
        );

        // Refresh project data
        dispatch(fetchProject(projectId));

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
    } catch (error: any) {
      console.error('WebSocket connection error:', error);
      toast({
        title: error.response?.data?.errorType || 'Connection Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
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

  const handleExecute = async () => {
    if (timeSpan < 3) {
      toast({
        title: 'Error',
        description: 'Time span must be at least 3 seconds',
        variant: 'destructive',
      });
      return;
    }

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
          minNativeAmount,
          maxNativeAmount,
          timeSpan: timeSpan * 1000,
          chainName: project?.chainName ?? 'BSC_MAINNET',
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

        // Call the success callback to enable the toggle
        onConfigurationSuccess?.();

        // Close the modal after successful configuration
        onOpenChange(false);

        // setTimeout(() => {
        //   fetchAndFillDetailedProejct(projectId);
        // }, 2000);
      } else {
        setIsExecuting(false);
        throw new Error(result.message || 'Configuration failed');
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to configure Volume Bot',
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
      // Update local state first
      setProject((prevProject) => {
        if (!prevProject) return null;
        return {
          ...prevProject,
          addons: {
            ...prevProject.addons,
            VolumeBot: {
              ...prevProject.addons.VolumeBot,
              isEnabled: false,
              depositWalletId: prevProject.addons.VolumeBot.depositWalletId,
            },
          },
        };
      });

      // Then update Redux state
      await dispatch(
        toggleBot({
          projectId: project._id,
          botId: project.addons.VolumeBot._id,
          enabled: false,
        })
      ).unwrap();

      // Wait for Redux state to be updated
      await dispatch(fetchProject(projectId));

      toast({
        title: 'Success',
        description: 'Volume Bot stopped successfully',
      });
    } catch (error: any) {
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to stop Volume Bot',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        onOpenChange(false);
        setIsExecuting(false);
      }}
    >
      <DialogContent className="max-w-2xl">
        <Card className="border-none shadow-none">
          <DialogTitle>Volume Bot Configuration</DialogTitle>
          <DialogDescription className="space-y-4 mt-10">
            {/* Min native currency Amount */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Min {nativeCurrency} Amount</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minNativeAmount}
                    onChange={(e) =>
                      setMinNativeAmount(parseFloat(e.target.value))
                    }
                    min={0.0001}
                    max={1.0}
                    step={0.001}
                    className="w-24 h-8 px-2 rounded-md border border-input bg-background text-sm"
                    disabled={isLoading || isExecuting}
                  />
                  <span className="text-sm font-medium">{nativeCurrency}</span>
                </div>
              </div>
              <Slider
                value={[minNativeAmount]}
                onValueChange={(value) => setMinNativeAmount(value[0])}
                min={0.0001}
                max={1.0}
                step={0.0001}
                className="w-full"
                disabled={isLoading || isExecuting}
              />
            </div>

            {/* Max native currency Amount */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Max {nativeCurrency} Amount</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={maxNativeAmount}
                    onChange={(e) =>
                      setMaxNativeAmount(parseFloat(e.target.value))
                    }
                    min={0.0002}
                    max={2.0}
                    step={0.0002}
                    className="w-24 h-8 px-2 rounded-md border border-input bg-background text-sm"
                    disabled={isLoading || isExecuting}
                  />
                  <span className="text-sm font-medium">{nativeCurrency}</span>
                </div>
              </div>
              <Slider
                value={[maxNativeAmount]}
                onValueChange={(value) => setMaxNativeAmount(value[0])}
                min={0.0002}
                max={2.0}
                step={0.0002}
                className="w-full"
                disabled={isLoading || isExecuting}
              />
            </div>

            {/* Time Span Between Transactions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Time Span Between Transactions (min 5s)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={timeSpan}
                    onChange={(e) => setTimeSpan(parseFloat(e.target.value))}
                    min={3}
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
                min={3}
                max={600}
                step={1}
                className="w-full"
                disabled={isLoading || isExecuting}
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-2">
              {project?.addons?.VolumeBot?.isEnabled ? (
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
                    isExecuting ||
                    isLoading ||
                    !project?.addons?.VolumeBot?._id ||
                    minNativeAmount === 0 ||
                    !minNativeAmount ||
                    maxNativeAmount === 0 ||
                    !maxNativeAmount ||
                    timeSpan === 0 ||
                    !timeSpan ||
                    timeSpan < 5
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
          </DialogDescription>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
