'use client';

import { useEffect, useState } from 'react';

import { BarChart3, Bot, Check, ChevronLeft, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { feeService } from '@/services/feeService';
import type { BotConfig } from '@/types/fee-calculator';

interface MultiStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId?: string;
  detectedTokens?: any[];
  onDeploy: (payload: any) => void;
  // Optional token validation props
  enableTokenValidation?: boolean;
  onTokenValidation?: (address: string) => Promise<any>;
  onTokenAddressChange?: (address: string) => void;
  tokenValidationStatus?: 'idle' | 'validating' | 'valid' | 'invalid';
  tokenValidationError?: string;
  validatedTokenInfo?: any;
  // Strategy configuration props
  strategyPresets?: Record<string, any>;
  // Reset callback
  onReset?: () => void;
}

export function MultiStepDialogAmbassador({
  open,
  onOpenChange,
  partnerId,
  detectedTokens,
  onDeploy,
  enableTokenValidation = false,
  onTokenValidation,
  onTokenAddressChange,
  tokenValidationStatus = 'idle',
  tokenValidationError,
  validatedTokenInfo,
  strategyPresets = {},
  onReset,
}: MultiStepDialogProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [_duration, _setDuration] = useState<string>('7 days');
  const [tokenAddressError, setTokenAddressError] = useState<string>('');
  // Add these new state variables
  const [buyTax, setBuyTax] = useState<string>('');
  const [sellTax, setSellTax] = useState<string>('');

  const steps = [
    {
      id: 'select-token',
      title: 'Select Your Token',
      description:
        'Deploy a new token or import an existing one to create a project',
    },
    {
      id: 'choose-strategy',
      title: 'Choose Strategy',
      description:
        'Deploy a new token or import an existing one to create a project',
    },
    {
      id: 'strategy-created',
      title: 'Strategy Created',
      description: 'Your strategy has been created successfully',
    },
  ];

  const isNextDisabled = () => {
    if (currentStep === 0) {
      // Only check for basic address format and validation in progress
      if (enableTokenValidation && tokenValidationStatus === 'validating') {
        return true; // Disable while validating
      }
      if (tokenValidationStatus === 'invalid') {
        return true; // Block progression if validation failed
      }
      if (tokenValidationStatus === 'valid') {
        // If token is validated, require tax inputs to proceed
        return !buyTax || !sellTax;
      }
      return !tokenAddress || !!tokenAddressError;
    }
    if (currentStep === 1) {
      return !selectedStrategy;
    }
    return false;
  };

  const handleNext = async () => {
    if (isNextDisabled()) return;

    // Step 0: Handle Token Validation only
    if (currentStep === 0) {
      if (tokenValidationStatus !== 'valid') {
        // If token is not yet validated or validation failed, try to validate it
        if (enableTokenValidation && onTokenValidation) {
          try {
            // If validation status is invalid, reset it first by clearing the address
            if (tokenValidationStatus === 'invalid' && onTokenAddressChange) {
              onTokenAddressChange(tokenAddress); // This will reset validation state
            }

            await onTokenValidation(tokenAddress);
            toast({
              title: 'Validation Successful',
              description: 'Please provide the token taxes below.',
            });
          } catch (error: any) {
            toast({
              title: 'Validation Failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        }
      } else {
        // If token IS already validated and taxes are provided, proceed to next step
        setCurrentStep(currentStep + 1);
      }
      return; // Halt further execution for this step.
    }

    // Step 1: Deploy strategy (create project/pack + deploy)
    if (currentStep === 1 && onDeploy) {
      onDeploy({
        type: 'deployStrategy',
        tokenAddress,
        strategy: selectedStrategy,
        duration: '7 days', // Default duration since we removed quick setup
        partnerId,
        buyTax: parseFloat(buyTax) || 0,
        sellTax: parseFloat(sellTax) || 0,
      });
      // Move to final step after deployment
      setCurrentStep(currentStep + 1);
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state when dialog closes
    setTimeout(() => {
      setCurrentStep(0);
      setSelectedStrategy(null);
      setTokenAddress('');
      setTokenAddressError('');
      setBuyTax('');
      setSellTax('');
    }, 300);
  };

  const handleDeployAnother = () => {
    // Reset all state values and go back to step 0
    setCurrentStep(0);
    setSelectedStrategy(null);
    setTokenAddress('');
    setTokenAddressError('');
    setBuyTax('');
    setSellTax('');

    // Clear validation state and local created items
    if (onTokenAddressChange) {
      onTokenAddressChange(''); // This will trigger validation state reset
    }
    if (onReset) {
      onReset(); // Clear local created items in parent component
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <SelectTokenStep
            tokenAddress={tokenAddress}
            setTokenAddress={setTokenAddress}
            detectedTokens={detectedTokens}
            tokenAddressError={tokenAddressError}
            setTokenAddressError={setTokenAddressError}
            enableTokenValidation={enableTokenValidation}
            onTokenValidation={onTokenValidation}
            onTokenAddressChange={onTokenAddressChange}
            tokenValidationStatus={tokenValidationStatus}
            tokenValidationError={tokenValidationError}
            validatedTokenInfo={validatedTokenInfo}
            buyTax={buyTax}
            setBuyTax={setBuyTax}
            sellTax={sellTax}
            setSellTax={setSellTax}
          />
        );
      case 1:
        return (
          <ChooseStrategyStep
            onSelect={setSelectedStrategy}
            selectedStrategy={selectedStrategy}
            strategyPresets={strategyPresets}
          />
        );
      case 2:
        return (
          <StrategyDeployedStep
            tokenAddress={tokenAddress}
            selectedStrategy={selectedStrategy}
            validatedTokenInfo={validatedTokenInfo}
            buyTax={buyTax}
            sellTax={sellTax}
          />
        );
      default:
        return null;
    }
  };

  const renderFooter = () => {
    if (currentStep === 0) {
      return (
        <DialogFooter className="flex justify-items-end sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={isNextDisabled()}
          >
            {tokenValidationStatus === 'validating' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Validating...
              </>
            ) : tokenValidationStatus === 'valid' ? (
              'Continue'
            ) : tokenValidationStatus === 'invalid' ? (
              'Try Again'
            ) : (
              'Validate Token'
            )}
          </Button>
        </DialogFooter>
      );
    } else if (currentStep === steps.length - 1) {
      return (
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleDeployAnother}
          >
            Deploy Another Strategy
          </Button>
          <Button variant="outline" asChild className="w-full">
            <a
              href={
                selectedStrategy?.startsWith('pack-') ? '/packs' : '/projects'
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Activate on Valmira
            </a>
          </Button>
        </DialogFooter>
      );
    } else {
      return (
        <DialogFooter className="flex justify-end sm:justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={isNextDisabled()}
          >
            Continue
          </Button>
        </DialogFooter>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-[550px]"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-tt">
            {steps[currentStep].title}
          </DialogTitle>
          {steps[currentStep].description && (
            <p className="text-sm text-muted-foreground">
              {steps[currentStep].description}
            </p>
          )}
        </DialogHeader>
        {renderStepContent()}
        {renderFooter()}
      </DialogContent>
    </Dialog>
  );
}

function ChooseStrategyStep({
  onSelect,
  selectedStrategy,
  strategyPresets = {},
}: {
  onSelect: (strategy: string) => void;
  selectedStrategy: string | null;
  strategyPresets?: Record<string, any>;
}) {
  // Fetch bot configurations from backend
  const {
    data: botConfigs,
    isLoading: isLoadingBots,
    error: botConfigsError,
  } = useQuery({
    queryKey: ['botConfigs'],
    queryFn: () => feeService.getBotConfigs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Bot metadata mapping for enhanced display
  const botMetadata = {
    liquidation: {
      complexity: 'Medium',
      features: [
        'Liquidation Monitoring',
        'Profit Generation',
        'Risk Management',
      ],
      description: 'Profit from liquidation opportunities in the market',
    },
    volume: {
      complexity: 'Low',
      features: ['Automated Trading', 'Volume Generation', 'Price Stability'],
      description: 'Boost trading volume with automated transactions',
    },
    'bundle-snipe': {
      complexity: 'High',
      features: ['Bundle Analysis', 'Fast Execution', 'MEV Protection'],
      description: 'Snipe opportunities in transaction bundles',
    },
    distribution: {
      complexity: 'Medium',
      features: [
        'Multi-wallet Distribution',
        'Gas Optimization',
        'Batch Processing',
      ],
      description: 'Distribute tokens to multiple wallets efficiently',
    },
  };

  // Get complexity indicator
  const getComplexityIndicator = (complexity: string) => {
    const levels = { Low: 1, Medium: 2, High: 3 };
    const level = levels[complexity as keyof typeof levels] || 1;

    return (
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 w-6 rounded-full ${
              i <= level ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  // Format daily fee for display
  const formatDailyFee = (fee: number) => {
    if (fee < 1) return `$${(fee * 30).toFixed(0)}/month`;
    return `$${fee.toFixed(0)}/day`;
  };

  // Create individual bot strategies from bot configs
  const createBotStrategies = () => {
    if (!botConfigs || botConfigs.length === 0) return [];

    return botConfigs.map((bot: BotConfig) => ({
      id: `single-${bot.id}`,
      name: `${bot.name} Only`,
      type: 'single-bot',
      botId: bot.id,
      description:
        botMetadata[bot.id as keyof typeof botMetadata]?.description ||
        bot.description,
      dailyFee: bot.dailyFee,
      complexity:
        botMetadata[bot.id as keyof typeof botMetadata]?.complexity || 'Medium',
      features: botMetadata[bot.id as keyof typeof botMetadata]?.features || [],
      bots: [bot.id],
    }));
  };

  // Create preset strategies from strategy presets
  const createPresetStrategies = () => {
    if (!strategyPresets || typeof strategyPresets !== 'object') return [];

    return Object.entries(strategyPresets)
      .filter(
        ([_id, preset]) => preset && typeof preset === 'object' && preset.bots
      )
      .map(([id, preset]) => ({
        id,
        name:
          preset.name ||
          id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        type: 'preset',
        description: `Combines ${preset.bots?.join(' + ') || 'multiple bots'} for comprehensive market making`,
        bots: preset.bots || [],
        complexity:
          (preset.bots?.length || 0) > 2
            ? 'High'
            : (preset.bots?.length || 0) > 1
              ? 'Medium'
              : 'Low',
        features: [
          'Automated Strategy',
          'Pre-configured Settings',
          `${preset.bots?.length || 0} Bot${(preset.bots?.length || 0) > 1 ? 's' : ''}`,
        ],
        estimatedCost: calculatePresetCost(preset.bots || []),
      }));
  };

  // Calculate estimated cost for preset
  const calculatePresetCost = (botIds: string[]) => {
    if (!botConfigs || !botIds || botIds.length === 0) return 'Calculating...';

    const totalCost = botIds.reduce((sum, botId) => {
      const bot = botConfigs.find((b: BotConfig) => b.id === botId);
      return sum + (bot?.dailyFee || 0);
    }, 0);

    if (totalCost === 0) return 'Cost TBD';

    return `$${Math.round(totalCost)}-${Math.round(totalCost * 1.5)}/day`;
  };

  if (isLoadingBots) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading bot configurations...</span>
        </div>
      </div>
    );
  }

  if (botConfigsError) {
    return (
      <div className="py-4">
        <div className="p-8 text-center text-red-600">
          Failed to load bot configurations. Please try again.
        </div>
      </div>
    );
  }

  const botStrategies = createBotStrategies();
  const _presetStrategies = createPresetStrategies();

  // Create pack strategies from pack configurations
  const createPackStrategies = () => {
    console.log('Debug - createPackStrategies called');
    console.log('Debug - strategyPresets:', strategyPresets);
    console.log(
      'Debug - strategyPresets.packConfigurations:',
      strategyPresets?.packConfigurations
    );

    if (
      !strategyPresets?.packConfigurations ||
      strategyPresets.packConfigurations.length === 0
    ) {
      console.log(
        'Debug - No pack configurations found, returning empty array'
      );
      return [];
    }

    return strategyPresets.packConfigurations.map((pack: any) => ({
      id: `pack-${pack.type}`,
      name: `${pack.type} Pack`,
      type: 'pack',
      description: pack.description,
      maxCost: pack.maxCost,
      outcome: pack.outcome || [],
      containingBots: pack.containingBots || [],
      packConfig: pack,
      complexity:
        pack.containingBots?.length > 3
          ? 'High'
          : pack.containingBots?.length > 2
            ? 'Medium'
            : 'Low',
    }));
  };

  const packStrategies = createPackStrategies();
  return (
    <div className="py-4">
      <Tabs defaultValue="bots" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="bots"
            className="flex items-center justify-center"
          >
            <Bot className="mr-2 h-4 w-4" />
            Bots
          </TabsTrigger>
          {/* <TabsTrigger
            value="presets"
            className="flex items-center justify-center"
          >
            <Zap className="mr-2 h-4 w-4" />
            Presets
          </TabsTrigger> */}
          <TabsTrigger
            value="packs"
            className="flex items-center justify-center"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Packs
          </TabsTrigger>
        </TabsList>
        {/* Enhanced Bots Tab */}
        <TabsContent value="bots" className="mt-4 space-y-4">
          {botStrategies.map((strategy) => (
            <div
              key={strategy.id}
              className={`rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedStrategy === strategy.id
                  ? 'border-primary ring-2 ring-primary'
                  : ''
              }`}
              onClick={() => onSelect(strategy.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg">{strategy.name}</h3>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
                  >
                    Available
                  </Badge>
                </div>
                <div className="h-6 w-6 rounded-full border flex items-center justify-center">
                  {selectedStrategy === strategy.id && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {strategy.description}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Complexity:</span>
                  {getComplexityIndicator(strategy.complexity)}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Daily Cost:</span>
                  <span className="font-medium">
                    {formatDailyFee(strategy.dailyFee || 0)}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Features:</span>
                  <div className="flex flex-wrap gap-1">
                    {strategy.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
        {/* Enhanced Presets Tab - COMMENTED OUT */}
        {/* <TabsContent value="presets" className="mt-4 space-y-4">
          {presetStrategies.length > 0 ? (
            presetStrategies.map((preset) => (
              <div
                key={preset.id}
                className={`rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedStrategy === preset.id
                    ? 'border-primary ring-2 ring-primary'
                    : ''
                }`}
                onClick={() => onSelect(preset.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{preset.name}</h3>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Preset Strategy
                    </Badge>
                  </div>
                  <div className="h-6 w-6 rounded-full border flex items-center justify-center">
                    {selectedStrategy === preset.id && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {preset.description}
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Complexity:</span>
                    {getComplexityIndicator(preset.complexity)}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Est. Cost:</span>
                    <span className="font-medium">{preset.estimatedCost}</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Included Bots:</span>
                    <div className="flex flex-wrap gap-1">
                      {preset.bots.map((botId: any, index: any) => {
                        const bot = botConfigs?.find(
                          (b: BotConfig) => b.id === botId
                        );
                        return (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {bot?.name || botId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Features:</span>
                    <div className="flex flex-wrap gap-1">
                      {preset.features.map((feature, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No preset strategies available</p>
              <p className="text-sm">
                Configure individual bots in the Bots tab
              </p>
            </div>
          )}
        </TabsContent> */}
        {/* Enhanced Packs Tab */}
        <TabsContent value="packs" className="mt-4 space-y-4">
          {packStrategies.length > 0 ? (
            packStrategies.map((pack: any) => (
              <div
                key={pack.id}
                className={`rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedStrategy === pack.id
                    ? 'border-primary ring-2 ring-primary'
                    : ''
                }`}
                onClick={() => onSelect(pack.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{pack.name}</h3>
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 hover:bg-purple-50 hover:text-purple-700"
                    >
                      Strategy Pack
                    </Badge>
                  </div>
                  <div className="h-6 w-6 rounded-full border flex items-center justify-center">
                    {selectedStrategy === pack.id && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {pack.description}
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Complexity:</span>
                    {getComplexityIndicator(pack.complexity)}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Max Cost:</span>
                    <span className="font-medium">${pack.maxCost}</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Included Bots:</span>
                    <div className="flex flex-wrap gap-1">
                      {pack.containingBots.map((botName: any, index: any) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {botName}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {pack.outcome.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">
                        Expected Outcomes:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {pack.outcome.map((outcome: any, index: any) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {outcome}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No Strategy Packs Available</p>
              <p className="text-sm">
                Strategy packs are being loaded or none are currently available.
              </p>
              <p className="text-sm">
                Choose from individual bots or preset strategies above.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SelectTokenStep({
  tokenAddress,
  setTokenAddress,
  detectedTokens,
  tokenAddressError,
  setTokenAddressError,
  enableTokenValidation = false,
  onTokenAddressChange,
  tokenValidationStatus = 'idle',
  tokenValidationError,
  validatedTokenInfo,
  buyTax,
  setBuyTax,
  sellTax,
  setSellTax,
}: {
  tokenAddress: string;
  setTokenAddress: (address: string) => void;
  detectedTokens?: any[];
  tokenAddressError: string;
  setTokenAddressError: (error: string) => void;
  enableTokenValidation?: boolean;
  onTokenValidation?: (address: string) => Promise<any>;
  onTokenAddressChange?: (address: string) => void;
  tokenValidationStatus?: 'idle' | 'validating' | 'valid' | 'invalid';
  tokenValidationError?: string;
  validatedTokenInfo?: any;
  buyTax: string;
  setBuyTax: (value: string) => void;
  sellTax: string;
  setSellTax: (value: string) => void;
}) {
  const handleTokenAddressChange = (address: string) => {
    setTokenAddress(address);
    if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setTokenAddressError('Invalid Ethereum address');
    } else {
      setTokenAddressError('');
    }

    // Notify parent component about address change for validation state management
    if (onTokenAddressChange) {
      onTokenAddressChange(address);
    }
  };

  useEffect(() => {
    if (detectedTokens && detectedTokens.length > 0) {
      handleTokenAddressChange(detectedTokens[0].address);
    }
  }, [detectedTokens]);

  return (
    <div className="py-4 space-y-6">
      <div>
        <Label htmlFor="token-select">Select Token Address</Label>
        <Select onValueChange={handleTokenAddressChange} value={tokenAddress}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="Select token address" />
          </SelectTrigger>
          <SelectContent>
            {detectedTokens &&
              detectedTokens.map((token) => (
                <SelectItem key={token.address} value={token.address}>
                  {token.name} ({token.symbol})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="mb-2">Or enter a token address manually</div>
        <Input
          placeholder="Enter your token address"
          value={tokenAddress}
          onChange={(e) => handleTokenAddressChange(e.target.value)}
          className={tokenAddressError ? 'border-red-500' : ''}
        />
        {tokenAddressError && (
          <p className="text-red-500 text-sm mt-1">{tokenAddressError}</p>
        )}

        {/* Token validation section */}
        {enableTokenValidation && tokenAddress && !tokenAddressError && (
          <div className="mt-4 space-y-2">
            {tokenValidationStatus === 'idle' && (
              <div className="p-3 border rounded-md bg-blue-50 border-blue-200">
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-blue-800">
                    Ready to validate
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Click Continue to validate this token and proceed to strategy
                  selection.
                </p>
              </div>
            )}

            {tokenValidationStatus === 'validating' && (
              <div className="flex items-center justify-center p-4 border rounded-md bg-yellow-50 border-yellow-200">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm font-medium text-yellow-800">
                  Validating token...
                </span>
              </div>
            )}

            {tokenValidationStatus === 'valid' && validatedTokenInfo && (
              <div className="p-4 border rounded-md bg-green-50 border-green-200">
                <div className="flex items-center mb-2">
                  <Check className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    Token validated successfully
                  </span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    <strong>Name:</strong> {validatedTokenInfo.name}
                  </p>
                  <p>
                    <strong>Symbol:</strong> {validatedTokenInfo.symbol}
                  </p>
                  <p>
                    <strong>Total Supply:</strong>{' '}
                    {validatedTokenInfo.totalSupply}
                  </p>
                </div>
              </div>
            )}

            {tokenValidationStatus === 'invalid' && (
              <div className="p-4 border rounded-md bg-red-50 border-red-200">
                <div className="flex items-center mb-2">
                  <div className="h-4 w-4 bg-red-600 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-red-800">
                    Token validation failed
                  </span>
                </div>
                {tokenValidationError && (
                  <p className="text-sm text-red-700 mb-2">
                    {tokenValidationError}
                  </p>
                )}
                <p className="text-sm text-red-700">
                  Please check the token address and click Continue to try
                  again.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {tokenValidationStatus === 'valid' && validatedTokenInfo && (
        <div className="p-4 border-t mt-4 space-y-4">
          <h3 className="text-lg font-medium text-center">
            Project Configuration
          </h3>
          <p className="text-sm text-center text-muted-foreground">
            Project for "{validatedTokenInfo.name}" will be created. Please
            provide the token taxes.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buy-tax">Buy Tax (%)</Label>
              <Input
                id="buy-tax"
                placeholder="e.g., 5"
                value={buyTax}
                onChange={(e) => setBuyTax(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sell-tax">Sell Tax (%)</Label>
              <Input
                id="sell-tax"
                placeholder="e.g., 5"
                value={sellTax}
                onChange={(e) => setSellTax(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {tokenValidationStatus === 'invalid' && (
        <div className="p-4 border-t mt-4 bg-red-50 border-red-200 rounded-lg">
          <p className="text-sm text-center text-red-700">
            Please resolve the validation error above before proceeding.
          </p>
        </div>
      )}
    </div>
  );
}

function StrategyDeployedStep({
  tokenAddress,
  selectedStrategy,
  validatedTokenInfo,
  buyTax,
  sellTax,
}: {
  tokenAddress: string;
  selectedStrategy: string | null;
  validatedTokenInfo?: any;
  buyTax: string;
  sellTax: string;
}) {
  const isPackStrategy = selectedStrategy?.startsWith('pack-');
  const strategyName = selectedStrategy
    ? isPackStrategy
      ? selectedStrategy.replace('pack-', '') + ' Pack'
      : selectedStrategy.replace('single-', '').charAt(0).toUpperCase() +
        selectedStrategy.replace('single-', '').slice(1) +
        ' Bot'
    : 'Unknown Strategy';

  return (
    <div className="py-4 space-y-6 text-center">
      <div className="flex justify-center">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-6 w-6 text-green-600" />
        </div>
      </div>
      <h3 className="font-bold text-xl">Strategy Created!</h3>
      <p className="text-muted-foreground">
        Your {isPackStrategy ? 'pack' : 'bot strategy'} has been successfully
        created. Click "Activate on Valmira" to activate and start using it.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <p className="text-blue-800">
          <strong>Next Step:</strong> Activate your strategy on the Valmira
          platform to start automated trading. Activation fees apply based on
          your selected strategy.
        </p>
      </div>

      <div className="border rounded-lg p-4 text-left bg-muted">
        <h4 className="font-medium mb-2">Strategy Details:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token:</span>
            <span className="font-mono text-xs">
              {tokenAddress
                ? `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`
                : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token Name:</span>
            <span>
              {validatedTokenInfo?.name || 'Unknown'} (
              {validatedTokenInfo?.symbol || 'N/A'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Strategy Type:</span>
            <span>{strategyName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Buy Tax:</span>
            <span>{buyTax || '0'}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sell Tax:</span>
            <span>{sellTax || '0'}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="text-orange-600">Inactive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
