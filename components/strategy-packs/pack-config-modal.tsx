'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ChevronLeft, ChevronRight, Info, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchGlobalPackParameters } from '@/store/slices/projectSlice';
import type { AppDispatch, RootState } from '@/store/store';

interface PackConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (config: any) => void;
  projectData: any;
}

// Mock pack types (8 total, 2 implemented)
const packIcons = ['🎯', '📊', '👥', '💰', '⚖️'];
// const packTypes = [
//   {
//     id: 'launch-day-pack',
//     name: 'Launch Day Pack',
//     icon: '🎯',
//     description: 'Multi-wallet sniping for token launches',
//     status: 'available',
//     estimatedCost: '$50-100/month',
//     features: ['Multi-wallet deployment', 'Smart gas optimization', 'Auto-distribution'],
//   },
//   {
//     id: 'marketing-surge-pack',
//     name: 'Marketing Surge Pack',
//     icon: '📊',
//     description: 'Generate consistent trading volume',
//     status: 'available',
//     estimatedCost: '$100-200/month',
//     features: ['Natural volume patterns', 'Configurable intervals', 'Volume targeting'],
//   },
//   {
//     id: 'holder-pack',
//     name: 'Holder Pack',
//     icon: '👥',
//     description: 'Increase holder count organically',
//     status: 'coming-soon',
//     estimatedCost: '$75-150/month',
//     features: ['Organic holder growth', 'Diverse wallet creation', 'Retention strategies'],
//   },
//   {
//     id: 'auto-sell-pack',
//     name: 'Auto Sell Pack',
//     icon: '💰',
//     description: 'Automated profit taking and stop losses',
//     status: 'coming-soon',
//     estimatedCost: '$25-75/month',
//     features: ['Price target selling', 'Stop loss protection', 'Portfolio management'],
//   },
//   {
//     id: 'market-maker-pack',
//     name: 'Market Maker Pack',
//     icon: '⚖️',
//     description: 'Provide liquidity and reduce volatility',
//     status: 'coming-soon',
//     estimatedCost: '$200-400/month',
//     features: ['Liquidity provision', 'Spread management', 'Volume stabilization'],
//   },
//   {
//     id: 'pump-pack',
//     name: 'Pump Pack',
//     icon: '🚀',
//     description: 'Coordinated price appreciation campaigns',
//     status: 'coming-soon',
//     estimatedCost: '$300-500/month',
//     features: ['Coordinated buying', 'FOMO creation', 'Chart optimization'],
//   },
//   {
//     id: 'anti-snipe-pack',
//     name: 'Anti-Snipe Pack',
//     icon: '🛡️',
//     description: 'Protect your launch from snipers',
//     status: 'coming-soon',
//     estimatedCost: '$100-200/month',
//     features: ['Sniper detection', 'Transaction blocking', 'Fair launch protection'],
//   },
//   {
//     id: 'social-pack',
//     name: 'Social Pack',
//     icon: '📱',
//     description: 'Automated social media engagement',
//     status: 'coming-soon',
//     estimatedCost: '$50-100/month',
//     features: ['Twitter automation', 'Telegram management', 'Community growth'],
//   },
// ];

export function PackConfigModal({
  isOpen,
  onClose,
  onNext,
  projectData,
}: PackConfigModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    globalPackParameters,
    loading: isLoadingGlobalPackParameters,
    error,
  } = useSelector((state: RootState) => state.projects);

  // 4 main states as requested
  const [currentTab, setCurrentTab] = useState('pack-selection');
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [allPackParams, setAllPackParams] = useState<any[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Load all pack configs whenever modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchGlobalPackParameters());
    }
  }, [isOpen, dispatch]);

  // Set allPackParams when global parameters are loaded from Redux
  useEffect(() => {
    if (globalPackParameters) {
      console.log('[globalPackParameters from Redux]', globalPackParameters);
      setAllPackParams(globalPackParameters);
    }
  }, [globalPackParameters]);

  const itemsPerSlide = 1;
  const totalSlides = Math.ceil(allPackParams.length / itemsPerSlide);

  const handlePackSelect = (packId: string) => {
    const pack = allPackParams.find(
      (p: any) => p.id === packId || p.name === packId || p.type === packId
    );
    if (pack) {
      setSelectedPack(pack);
    }
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const getCurrentSlideItems = () => {
    const startIndex = currentSlideIndex * itemsPerSlide;
    return allPackParams.slice(startIndex, startIndex + itemsPerSlide);
  };

  const handleContinueToConfig = () => {
    if (selectedPack) {
      setCurrentTab('configuration');
    }
  };

  const handleRetryLoadPacks = () => {
    dispatch(fetchGlobalPackParameters());
  };

  const handleFinishConfiguration = () => {
    // Extract packType from selectedPack (use the 'type' field from globalPackParams)
    const packType =
      selectedPack?.type || selectedPack?.name || selectedPack?.id;

    // Extract containingBots from selectedPack (order determines execution)
    const containingBots = selectedPack?.containingBots || [];

    // Build packConfig with only the configured bot configs
    const packConfig: any = {};
    if (selectedPack?.snipeBotConfig) {
      packConfig.snipeBotConfig = selectedPack.snipeBotConfig;
    }
    if (selectedPack?.distributionBotConfig) {
      // Only include targetWalletCount field for distribution bot
      packConfig.distributionBotConfig = {
        targetWalletCount: selectedPack.distributionBotConfig.targetWalletCount,
      };
    }
    if (selectedPack?.volumeBotConfig) {
      packConfig.volumeBotConfig = selectedPack.volumeBotConfig;
    }
    if (selectedPack?.holderBotConfig) {
      packConfig.holderBotConfig = selectedPack.holderBotConfig;
    }
    if (selectedPack?.autoSellBotConfig) {
      packConfig.autoSellBotConfig = selectedPack.autoSellBotConfig;
    }
    if (selectedPack?.trendingBotConfig) {
      packConfig.trendingBotConfig = selectedPack.trendingBotConfig;
    }

    onNext({
      packType,
      packConfig,
      containingBots,
      // Include all project data fields for pack creation
      ...projectData,
    });
  };

  const renderPackSelection = () => {
    // Show loading spinner while fetching global parameters
    if (isLoadingGlobalPackParameters) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading pack configurations...
            </p>
          </div>
        </div>
      );
    }

    // Show error state if loading failed
    if (error && !isLoadingGlobalPackParameters && !globalPackParameters) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4 max-w-md">
            <Alert className="border-destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium text-destructive">
                    Failed to load pack configurations
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Array.isArray(error)
                      ? error[1] || error[0]
                      : error ||
                        'An error occurred while loading pack configurations. Please try again.'}
                  </p>
                  <Button
                    onClick={handleRetryLoadPacks}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                    Retry Loading
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    // Show empty state if no packs are available
    if (
      !isLoadingGlobalPackParameters &&
      !error &&
      (!allPackParams || allPackParams.length === 0)
    ) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Info className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No pack configurations available
            </p>
            <Button onClick={handleRetryLoadPacks} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Choose Your Strategy Pack</h3>
          <p className="text-sm text-muted-foreground">
            Select a pack type to get started
          </p>
        </div>

        {/* Pack Type Slider */}
        <div className="relative">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevSlide}
              disabled={totalSlides <= 1}
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {getCurrentSlideItems().map((pack: any, index: number) => (
                  <Card
                    key={pack.id || index}
                    onClick={() => handlePackSelect(pack.id || pack.type)}
                    className={`cursor-pointer ${selectedPack?.id === pack.id || selectedPack?.type === pack.type ? 'ring-1 ring-primary border-primary bg-primary/5' : ''}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                          <span className="text-xl">
                            {packIcons[index % packIcons.length]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-md font-semibold leading-tight ">
                              {pack.type} Pack
                            </CardTitle>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-4">
                      <CardDescription className="text-sm leading-relaxed">
                        {pack.description}
                      </CardDescription>

                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-primary">
                          Max Cost: ${pack.maxCost}
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-col sm:flex-row gap-2">
                        {/* Outcome/Features */}
                        {pack.outcome && pack.outcome.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-foreground">
                              Key Outcomes:
                            </div>
                            <ul className="space-y-1.5">
                              {pack.outcome.map(
                                (outcome: string, outcomeIndex: number) => (
                                  <li
                                    key={outcomeIndex}
                                    className="text-xs text-muted-foreground flex items-start gap-2"
                                  >
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-1.5"></div>
                                    <span className="leading-relaxed">
                                      {outcome}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {/* containingBots */}
                        {pack.containingBots &&
                          pack.containingBots.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-foreground">
                                Containing Bots:
                              </div>
                              <ul className="space-y-1.5">
                                {pack.containingBots.map(
                                  (bot: string, botIndex: number) => (
                                    <li
                                      key={botIndex}
                                      className="text-xs text-muted-foreground flex items-start gap-2"
                                    >
                                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-1.5"></div>
                                      <span className="leading-relaxed">
                                        {bot}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextSlide}
              disabled={totalSlides <= 1}
              className="flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Slide indicators */}
          {totalSlides > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlideIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                  onClick={() => setCurrentSlideIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConfiguration = () => {
    if (!selectedPack) return null;

    // Show loading state while fetching global parameters
    if (isLoadingGlobalPackParameters) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading global parameters...
            </p>
          </div>
        </div>
      );
    }

    const renderConfigFields = () => {
      return (
        <div className="space-y-6">
          {/* Snipe Bot Configuration */}
          {selectedPack.snipeBotConfig && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-primary">
                Snipe Bot Configuration
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="walletCount">Wallet Count</Label>
                  <Input
                    id="walletCount"
                    type="number"
                    value={selectedPack.snipeBotConfig.walletCount || 0}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || 0;
                      setSelectedPack((prev: any) => ({
                        ...prev,
                        snipeBotConfig: {
                          ...prev.snipeBotConfig,
                          walletCount: newValue,
                        },
                      }));
                    }}
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of wallets to use for sniping (1-10)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenAmount">Token Amount</Label>
                  <Input
                    id="tokenAmount"
                    type="number"
                    value={selectedPack.snipeBotConfig.tokenAmount || 0}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value) || 0;
                      setSelectedPack((prev: any) => ({
                        ...prev,
                        snipeBotConfig: {
                          ...prev.snipeBotConfig,
                          tokenAmount: newValue,
                        },
                      }));
                    }}
                    min="10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Token amount for each wallet
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Distribution Bot Configuration - Show right after snipe bot */}
          {selectedPack.distributionBotConfig && (
            <>
              {selectedPack.snipeBotConfig && <Separator className="my-6" />}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-primary">
                  Distribution Bot Configuration
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="targetWalletCountAfterSnipe">
                    Target Wallet Count
                  </Label>
                  <Input
                    id="targetWalletCountAfterSnipe"
                    type="number"
                    value={
                      selectedPack.distributionBotConfig.targetWalletCount || 20
                    }
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || 20;
                      setSelectedPack((prev: any) => ({
                        ...prev,
                        distributionBotConfig: {
                          targetWalletCount: newValue,
                        },
                      }));
                    }}
                    min="10"
                    max="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Distribute sniped tokens to this many wallets (10-1000)
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Volume Bot Configuration */}
          {selectedPack.volumeBotConfig && (
            <>
              {(selectedPack.snipeBotConfig ||
                selectedPack.distributionBotConfig) && (
                <Separator className="my-6" />
              )}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-primary">
                  Volume Bot Configuration
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minNativeAmount">Min Native Amount</Label>
                    <Input
                      id="minNativeAmount"
                      type="number"
                      step="0.0001"
                      value={selectedPack.volumeBotConfig.minNativeAmount || 0}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0;
                        setSelectedPack((prev: any) => ({
                          ...prev,
                          volumeBotConfig: {
                            ...prev.volumeBotConfig,
                            minNativeAmount: newValue,
                          },
                        }));
                      }}
                      min="0.0001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxNativeAmount">Max Native Amount</Label>
                    <Input
                      id="maxNativeAmount"
                      type="number"
                      step="0.0001"
                      value={selectedPack.volumeBotConfig.maxNativeAmount || 0}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0;
                        setSelectedPack((prev: any) => ({
                          ...prev,
                          volumeBotConfig: {
                            ...prev.volumeBotConfig,
                            maxNativeAmount: newValue,
                          },
                        }));
                      }}
                      min="0.0001"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeSpan">
                      Time Between Transactions (seconds)
                    </Label>
                    <Input
                      id="timeSpan"
                      type="number"
                      value={
                        selectedPack.volumeBotConfig
                          .timeSpanBetweenTransactions / 1000 || 0
                      }
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) * 1000 || 0;
                        setSelectedPack((prev: any) => ({
                          ...prev,
                          volumeBotConfig: {
                            ...prev.volumeBotConfig,
                            timeSpanBetweenTransactions: newValue,
                          },
                        }));
                      }}
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum time between volume transactions
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetVolume">Target Volume</Label>
                    <Input
                      id="targetVolume"
                      type="number"
                      value={selectedPack.volumeBotConfig.targetVolume || 0}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0;
                        setSelectedPack((prev: any) => ({
                          ...prev,
                          volumeBotConfig: {
                            ...prev.volumeBotConfig,
                            targetVolume: newValue,
                          },
                        }));
                      }}
                      min="100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Daily target volume
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Holder Bot Configuration */}
          {selectedPack.holderBotConfig && (
            <>
              {(selectedPack.snipeBotConfig ||
                selectedPack.distributionBotConfig ||
                selectedPack.volumeBotConfig) && <Separator className="my-6" />}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-primary">
                  Holder Bot Configuration
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="targetHolders">Target Holders</Label>
                  <Input
                    id="targetHolders"
                    type="number"
                    value={selectedPack.holderBotConfig.targetHolders || 0}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || 0;
                      setSelectedPack((prev: any) => ({
                        ...prev,
                        holderBotConfig: {
                          ...prev.holderBotConfig,
                          targetHolders: newValue,
                        },
                      }));
                    }}
                    min="10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Target number of holders to achieve
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Auto Sell Bot Configuration */}
          {selectedPack.autoSellBotConfig && (
            <>
              {(selectedPack.snipeBotConfig ||
                selectedPack.distributionBotConfig ||
                selectedPack.volumeBotConfig ||
                selectedPack.holderBotConfig) && <Separator className="my-6" />}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-primary">
                  Auto Sell Bot Configuration
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetPrice">Target Price Multiplier</Label>
                    <Input
                      id="targetPrice"
                      type="number"
                      step="0.1"
                      value={selectedPack.autoSellBotConfig.targetPrice || 0}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0;
                        setSelectedPack((prev: any) => ({
                          ...prev,
                          autoSellBotConfig: {
                            ...prev.autoSellBotConfig,
                            targetPrice: newValue,
                          },
                        }));
                      }}
                      min="1.1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Sell when price reaches this multiplier (e.g., 2.0 = 2x)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stopLoss">Stop Loss Multiplier</Label>
                    <Input
                      id="stopLoss"
                      type="number"
                      step="0.1"
                      value={selectedPack.autoSellBotConfig.stopLoss || 0}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0;
                        setSelectedPack((prev: any) => ({
                          ...prev,
                          autoSellBotConfig: {
                            ...prev.autoSellBotConfig,
                            stopLoss: newValue,
                          },
                        }));
                      }}
                      min="0.1"
                      max="0.9"
                    />
                    <p className="text-xs text-muted-foreground">
                      Sell when price drops to this multiplier (e.g., 0.8 =
                      -20%)
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* No configuration available */}
          {!selectedPack.snipeBotConfig &&
            !selectedPack.distributionBotConfig &&
            !selectedPack.volumeBotConfig &&
            !selectedPack.holderBotConfig &&
            !selectedPack.autoSellBotConfig && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No configuration options available for this pack.
                </p>
              </div>
            )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentTab('pack-selection')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold">
              Configure {selectedPack?.type}
            </h3>
            <p className="text-sm text-muted-foreground">
              Set up your pack parameters
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{packIcons[0]}</span>
              <div>
                <CardTitle>{selectedPack?.type} Configuration</CardTitle>
                <CardDescription>
                  Customize the settings for your{' '}
                  {selectedPack?.type.toLowerCase()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>{renderConfigFields()}</CardContent>
        </Card>

        {/* Estimated Cost */}
        <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
          <span className="font-medium">Max Cost:</span>
          <span className="text-lg font-bold text-primary">
            ${selectedPack?.maxCost}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <DialogHeader>
        <DialogTitle>Create Strategy Pack</DialogTitle>
        <DialogDescription>
          {currentTab === 'pack-selection'
            ? 'Choose and configure your strategy pack'
            : `Configure your ${selectedPack?.name}`}
        </DialogDescription>
      </DialogHeader>

      <div className="py-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pack-selection">Pack Selection</TabsTrigger>
            <TabsTrigger value="configuration" disabled={!selectedPack}>
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pack-selection" className="mt-6">
            {renderPackSelection()}
          </TabsContent>

          <TabsContent value="configuration" className="mt-6">
            {renderConfiguration()}
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {currentTab === 'pack-selection' ? (
          <Button onClick={handleContinueToConfig} disabled={!selectedPack}>
            Continue to Configuration
          </Button>
        ) : (
          <Button onClick={handleFinishConfiguration}>
            Continue to Token Selection
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}
