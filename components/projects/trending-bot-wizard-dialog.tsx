import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { BotService } from '@/services/botService';
import { toggleBot } from '@/store/slices/botSlice';
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

interface TrendingBotWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationSuccess?: () => void;
}

interface ExtendedProject extends Project {
  addons: {
    TrendingBot: {
      _id?: string;
      isEnabled?: boolean;
      depositWalletId: {
        publicKey: string;
      };
      nativeBalance?: number;
      generatedVolume?: number;
      minNativeAmount?: number;
      maxNativeAmount?: number;
      upwardSellRateMin?: number;
      upwardSellRateMax?: number;
      downwardSellRateMin?: number;
      downwardSellRateMax?: number;
      timeSpanBetweenTransactions?: number;
      trend?: 'upward' | 'downward';
      targetMinutes?: number;
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

export function TrendingBotWizardDialog({
  open,
  onOpenChange,
  onConfigurationSuccess,
}: TrendingBotWizardDialogProps) {
  // const { id: projectId } = useParams() as { id: string };
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const dispatch = useDispatch<AppDispatch>();

  // Initialize project state
  const [project, setProject] = useState<ExtendedProject | null>(null);
  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(false);

  // TrendingBot configuration state
  const [config, setConfig] = useState({
    minNativeAmount: 0.0001,
    maxNativeAmount: 0.0005,
    upwardSellRateMin: 50,
    upwardSellRateMax: 100,
    downwardSellRateMin: 120,
    downwardSellRateMax: 150,
    timeSpanBetweenTransactions: 15000, // 5 seconds
    trend: 'upward' as 'upward' | 'downward',
    targetMinutes: 30,
  });

  // Update local project state when currentProject changes
  useEffect(() => {
    if (!currentProject) return;
    setProject(currentProject as ExtendedProject);

    // Load existing config if available
    const trendingBot = (currentProject as ExtendedProject)?.addons
      ?.TrendingBot;
    if (trendingBot) {
      setConfig({
        minNativeAmount: trendingBot.minNativeAmount || 0.001,
        maxNativeAmount: trendingBot.maxNativeAmount || 0.005,
        upwardSellRateMin: trendingBot.upwardSellRateMin || 50,
        upwardSellRateMax: trendingBot.upwardSellRateMax || 100,
        downwardSellRateMin: trendingBot.downwardSellRateMin || 120,
        downwardSellRateMax: trendingBot.downwardSellRateMax || 150,
        timeSpanBetweenTransactions:
          trendingBot.timeSpanBetweenTransactions || 15000,
        trend: trendingBot.trend || 'upward',
        targetMinutes: trendingBot.targetMinutes || 30,
      });
    }
  }, [currentProject]);

  const nativeCurrency =
    project?.chainName === 'BSC_MAINNET'
      ? 'BNB'
      : project?.chainName === 'ETH_MAINNET'
        ? 'ETH'
        : 'SOL';

  const handleExecute = async () => {
    if (!project?.addons?.TrendingBot?._id) {
      toast({
        title: 'Error',
        description: 'TrendingBot configuration not found',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);
    setExecutionSuccess(false);

    try {
      const response = await BotService.configureTrendingBot(
        project.addons.TrendingBot._id,
        config
      );

      if (response.success) {
        setExecutionSuccess(true);
        toast({
          title: 'TrendingBot Configured',
          description:
            'TrendingBot has been successfully configured and enabled.',
        });

        // Enable the bot
        await dispatch(
          toggleBot({
            projectId: project._id,
            botId: project.addons.TrendingBot._id,
            enabled: true,
          })
        ).unwrap();

        // Refresh project data
        dispatch(fetchProject(project._id));
        dispatch(fetchProjects());

        // Call success callback
        if (onConfigurationSuccess) {
          onConfigurationSuccess();
        }

        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to configure TrendingBot');
      }
    } catch (error: any) {
      console.error('TrendingBot execution error:', error);
      const { title, message } = parseErrorMessage(
        error.response?.data?.errorMessage || error.message,
        error.response?.data?.errorDetails || '',
        nativeCurrency
      );

      toast({
        title,
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = () => {
    setExecutionSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogTitle>Configure Trending Bot</DialogTitle>
        <DialogDescription>
          Set up your trending bot to create automated market movements with
          customizable patterns.
        </DialogDescription>

        <div className="space-y-6">
          {/* Native Amount Range */}
          <Card className="p-4">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                Native Amount Range ({nativeCurrency})
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minAmount">Minimum Amount</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    step="0.00001"
                    min="0.00001"
                    value={config.minNativeAmount}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        minNativeAmount: Math.max(
                          0.00001,
                          parseFloat(e.target.value) || 0.00001
                        ),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxAmount">Maximum Amount</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    step="0.0001"
                    min={config.minNativeAmount}
                    value={config.maxNativeAmount}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        maxNativeAmount: Math.max(
                          config.minNativeAmount,
                          parseFloat(e.target.value) || 0.05
                        ),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Trend Direction */}
          <Card className="p-4">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Trend Direction</Label>
              <Select
                value={config.trend}
                onValueChange={(value: 'upward' | 'downward') =>
                  setConfig({ ...config, trend: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trend direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upward">Upward Trend</SelectItem>
                  <SelectItem value="downward">Downward Trend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Sell Rate Configuration */}
          <Card className="p-4">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                Sell Rate Configuration (%)
              </Label>

              {config.trend === 'upward' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="upwardMin">Upward Min Rate</Label>
                    <Input
                      id="upwardMin"
                      type="number"
                      min="0"
                      max="100"
                      value={config.upwardSellRateMin}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          upwardSellRateMin: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="upwardMax">Upward Max Rate</Label>
                    <Input
                      id="upwardMax"
                      type="number"
                      min={config.upwardSellRateMin}
                      max="100"
                      value={config.upwardSellRateMax}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          upwardSellRateMax: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="downwardMin">Downward Min Rate</Label>
                    <Input
                      id="downwardMin"
                      type="number"
                      min="101"
                      max="1000"
                      value={config.downwardSellRateMin}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          downwardSellRateMin: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="downwardMax">Downward Max Rate</Label>
                    <Input
                      id="downwardMax"
                      type="number"
                      min={config.downwardSellRateMin}
                      max="1000"
                      value={config.downwardSellRateMax}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          downwardSellRateMax: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Time Span Between Transactions */}
          <Card className="p-4">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                Time Between Transactions:{' '}
                {(config.timeSpanBetweenTransactions / 1000).toFixed(1)} seconds
              </Label>
              <Slider
                value={[config.timeSpanBetweenTransactions]}
                onValueChange={(value) =>
                  setConfig({
                    ...config,
                    timeSpanBetweenTransactions: value[0],
                  })
                }
                min={1000}
                max={60000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1s</span>
                <span>60s</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                Target Minutes: {config.targetMinutes} minutes
              </Label>
              <Slider
                value={[config.targetMinutes]}
                onValueChange={(value) =>
                  setConfig({
                    ...config,
                    targetMinutes: value[0],
                  })
                }
                min={1}
                max={60}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1m</span>
                <span>60m</span>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleExecute}
              disabled={isExecuting}
              className="flex-1"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configuring...
                </>
              ) : executionSuccess ? (
                'Configuration Complete!'
              ) : (
                'Configure & Enable'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
