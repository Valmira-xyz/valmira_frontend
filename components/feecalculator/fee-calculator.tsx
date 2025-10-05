// valmiraxyz-frontend-main/components/feecalculator/fee-calculator.tsx
'use client';

import { useEffect, useState } from 'react';

import { FeeBreakdown } from './fee-breakdown';
import { MonthlyCostChart } from './monthly-cost-chart';
import {
  Calculator,
  DollarSign,
  InfoIcon as InfoCircle,
  PieChart,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';
import { feeService, GlobalFeeConfig } from '@/services/feeService';
import type {
  BotConfig,
  BotType,
  CalculatorState,
  FeeCalculation,
} from '@/types/fee-calculator';

// NO LONGER IMPORTING staticBotCalculatorMetadata DIRECTLY HERE.
// The feeService now handles combining it with dynamic pricing.

// Helper component to render an individual bot card and its inputs
interface BotCardProps {
  bot: BotConfig;
  isSelected: boolean;
  toggleBot: (botId: BotType) => void;
  botInputs: CalculatorState['botInputs'];
  updateBotInput: (botId: BotType, fieldId: string, value: any) => void;
  performanceFeeOptionsState: CalculatorState['performanceFeeOptions'];
  updatePerformanceFeeOption: (botId: BotType, optionIndex: number) => void;
}

const BotCard: React.FC<BotCardProps> = ({
  bot,
  isSelected,
  toggleBot,
  botInputs,
  updateBotInput,
  performanceFeeOptionsState,
  updatePerformanceFeeOption,
}) => {
  return (
    <Card
      key={bot.id}
      className={`relative overflow-hidden transition-all duration-300 flex flex-col h-full ${isSelected ? 'border-primary ring-2 ring-primary' : ''}`}
    >
      <CardHeader className="!p-4">
        <div className="flex items-center justify-between ">
          <CardTitle className="text-lg font-semibold font-tt">
            {bot.name}
          </CardTitle>
          <Switch
            checked={isSelected}
            onCheckedChange={() => toggleBot(bot.id as BotType)}
          />
        </div>
        <CardDescription className="text-sm">{bot.description}</CardDescription>
      </CardHeader>

      {isSelected && (
        <>
          <CardContent className="h-full ">
            <div className="space-y-4 flex-1">
              {bot.inputFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center">
                    <Label
                      htmlFor={`${bot.id}-${field.id}`}
                      className="text-sm"
                    >
                      {field.label}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoCircle className="w-4 h-4 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{field.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {field.type === 'number' && (
                    <div className="flex">
                      {field.prefix && (
                        <span className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                          {field.prefix}
                        </span>
                      )}
                      <Input
                        id={`${bot.id}-${field.id}`}
                        type="number"
                        value={botInputs[bot.id as BotType]?.[field.id] || ''} // Handle potential undefined with || ''
                        onChange={(e) =>
                          updateBotInput(
                            bot.id as BotType,
                            field.id,
                            Number.parseFloat(e.target.value) || 0
                          )
                        }
                        className={field.prefix ? 'rounded-l-none' : ''}
                      />
                      {field.suffix && (
                        <span className="flex items-center px-3 border border-l-0 rounded-r-md bg-muted">
                          {field.suffix}
                        </span>
                      )}
                    </div>
                  )}

                  {field.type === 'slider' && (
                    <div className="space-y-2">
                      <Slider
                        id={`${bot.id}-${field.id}`}
                        min={field.min || 0}
                        max={field.max || 100}
                        step={1}
                        value={[botInputs[bot.id as BotType]?.[field.id] || 0]} // Handle potential undefined with || 0
                        onValueChange={(value) =>
                          updateBotInput(bot.id as BotType, field.id, value[0])
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{field.min || 0}</span>
                        <span>
                          {field.prefix}
                          {botInputs[bot.id as BotType]?.[field.id]}
                          {field.suffix}
                        </span>
                        <span>{field.max || 100}</span>
                      </div>
                    </div>
                  )}

                  {field.type === 'select' && field.options && (
                    <Select
                      value={
                        botInputs[bot.id as BotType]?.[field.id]?.toString() ||
                        ''
                      } // Handle potential undefined with || ''
                      onValueChange={(value) =>
                        updateBotInput(
                          bot.id as BotType,
                          field.id,
                          field.options?.find(
                            (opt) => opt.value.toString() === value
                          )?.value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option, index) => (
                          <SelectItem
                            key={index}
                            value={option.value.toString()}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}

              {bot.performanceFeeOptions.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-sm">Performance Fee Structure</Label>
                  <Select
                    value={
                      performanceFeeOptionsState[
                        bot.id as BotType
                      ]?.toString() || '0'
                    } // Handle potential undefined with || '0'
                    onValueChange={(value) =>
                      updatePerformanceFeeOption(
                        bot.id as BotType,
                        Number.parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bot.performanceFeeOptions.map((option, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {option.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
          <div className="flex items-center bg-muted rounded-lg p-2 mx-4 justify-between text-sm mt-auto mb-4">
            <span>Daily Fee:</span>
            <span className="font-medium">${bot.dailyFee}/day</span>
          </div>
        </>
      )}
    </Card>
  );
};

export function FeeCalculator() {
  // Use useQuery to fetch the complete BotConfig array, now with dynamic pricing merged in feeService
  const {
    data: fetchedBotConfigs,
    isLoading: isLoadingConfigs,
    error: configsError,
  } = useQuery<BotConfig[]>({
    queryKey: ['calculatorBotConfigsFull'],
    queryFn: () => feeService.getBotConfigs(), // Call the correct method
    staleTime: Infinity, // Pricing and UI metadata data likely doesn't change often
  });

  // botConfigs state variable to hold the fetched and initialized bot configurations
  const [botConfigs, setBotConfigs] = useState<BotConfig[]>([]);

  // States for calculator's internal values (user inputs and selections)
  const [selectedBots, setSelectedBots] = useState<BotType[]>([]);
  const [botInputs, setBotInputs] = useState<CalculatorState['botInputs']>({
    liquidation: {},
    volume: {},
    'bundle-snipe': {},
    distribution: {},
  }); // Initialize with all bot keys

  const [performanceFeeOptionsState, setPerformanceFeeOptionsState] = useState<
    CalculatorState['performanceFeeOptions']
  >({
    liquidation: 0,
    volume: 0,
    'bundle-snipe': 0,
    distribution: 0,
  }); // Initialize with all bot keys
  const [projectCount, setProjectCount] = useState(1);
  const [calculations, setCalculations] = useState<FeeCalculation>({
    setupFee: 0,
    dailyFees: 0,
    monthlyDailyFees: 0,
    performanceFees: [],
    totalMonthlyFees: 0,
    totalAnnualFees: 0,
    savingsFromEarlyAdoption: 0,
    totalMonthlyFeesAllProjects: 0,
    totalAnnualFeesAllProjects: 0,
  });

  // Fetch GlobalFeeConfig specifically for projectSetupFee and caps
  // (These are global and not part of individual BotConfig, so still fetched separately)
  const {
    data: globalFeesForCapsAndSetup,
    isLoading: isLoadingGlobalFees,
    error: globalFeesError,
  } = useQuery<GlobalFeeConfig>({
    queryKey: ['globalFeesForCalculatorCaps'],
    queryFn: () => feeService.getGlobalFees(),
    staleTime: Infinity,
  });

  // Effect to initialize botConfigs state and input states once fetchedBotConfigs is available
  useEffect(() => {
    if (fetchedBotConfigs && fetchedBotConfigs.length > 0) {
      setBotConfigs(fetchedBotConfigs);

      const initialBotInputs: CalculatorState['botInputs'] = {
        liquidation: {},
        volume: {},
        'bundle-snipe': {},
        distribution: {},
      };
      const initialPerformanceFeeOptions: CalculatorState['performanceFeeOptions'] =
        {
          liquidation: 0,
          volume: 0,
          'bundle-snipe': 0,
          distribution: 0,
        };
      const initialSelectedBots: BotType[] = []; // Initialize to no bots selected by default

      fetchedBotConfigs.forEach((bot) => {
        initialBotInputs[bot.id as BotType] = {};
        bot.inputFields.forEach((field) => {
          // Set initial input values from the 'default' property of fetched config
          initialBotInputs[bot.id as BotType][field.id] = field.default;
        });
        // Set initial selected performance option from fetched config
        initialPerformanceFeeOptions[bot.id as BotType] =
          bot.defaultPerformanceFeeOption;
        // Optionally, if you want some bots to be selected by default, add them here
        // For a calculator, usually none are selected initially, or one is
        // initialSelectedBots.push(bot.id as BotType); // Example: Select all by default
      });
      setBotInputs(initialBotInputs);
      setPerformanceFeeOptionsState(initialPerformanceFeeOptions);
      setSelectedBots(initialSelectedBots); // Set initial selected bots
    } else if (configsError) {
      console.error(
        'Failed to load bot configurations for calculator:',
        configsError
      );
      // botConfigs state will remain empty, triggering error/loading UI
    }
  }, [fetchedBotConfigs, configsError]); // Depend on fetched data

  // Function to toggle bot selection
  const toggleBot = (botId: BotType) => {
    setSelectedBots((prev) => {
      const isSelected = prev.includes(botId);
      return isSelected ? prev.filter((id) => id !== botId) : [...prev, botId];
    });
  };

  // Function to update bot input values
  const updateBotInput = (botId: BotType, fieldId: string, value: any) => {
    setBotInputs((prev) => ({
      ...prev,
      [botId]: {
        ...prev[botId],
        [fieldId]: value,
      },
    }));
  };

  // Function to update performance fee option (by index of the options from fetched bot config)
  const updatePerformanceFeeOption = (botId: BotType, optionIndex: number) => {
    setPerformanceFeeOptionsState((prev) => ({
      ...prev,
      [botId]: optionIndex,
    }));
  };

  // Function to update project count
  const updateProjectCount = (count: number) => {
    setProjectCount(count);
  };

  // Function to calculate fees based on the current state and the dynamically loaded botConfigs
  const calculateFees = (currentBotConfigs: BotConfig[]): FeeCalculation => {
    if (!currentBotConfigs || currentBotConfigs.length === 0) {
      return {
        setupFee: 0,
        dailyFees: 0,
        monthlyDailyFees: 0,
        performanceFees: [],
        totalMonthlyFees: 0,
        totalAnnualFees: 0,
        savingsFromEarlyAdoption: 0,
        totalMonthlyFeesAllProjects: 0,
        totalAnnualFeesAllProjects: 0,
      };
    }

    const setupFeeBase = globalFeesForCapsAndSetup?.projectSetupFee ?? 200;
    const setupFee = setupFeeBase;

    let dailyFeesTotal = 0;
    const performanceFees: FeeCalculation['performanceFees'] = [];

    selectedBots.forEach((botId) => {
      const botConfig = currentBotConfigs.find((bot) => bot.id === botId)!; // Use the dynamically priced bot configs
      const inputs = botInputs[botId];
      const performanceFeeOptionIndex = performanceFeeOptionsState[botId];
      const selectedPerformanceOption =
        botConfig.performanceFeeOptions[performanceFeeOptionIndex]; // This option's value is already from backend

      // --- Calculate Daily Fee ---
      const activeDays = inputs.activeDaysPerMonth || 30;
      const botDailyFeeRate = botConfig.dailyFee; // This is already populated from backend
      const botDailyFeeAmount = botDailyFeeRate * activeDays;
      dailyFeesTotal += botDailyFeeAmount;

      // --- Calculate Performance Fee ---
      let calculatedPerformanceFeeAmount = 0;
      let actualFeeValueUsedInCalculation = selectedPerformanceOption.value; // Start with the backend-populated value

      switch (botId) {
        case 'liquidation':
          calculatedPerformanceFeeAmount =
            (inputs.expectedMonthlyProfit * actualFeeValueUsedInCalculation) /
            100;
          break;
        case 'volume':
          actualFeeValueUsedInCalculation = inputs.feeRate; // Use the value selected by user from the dropdown
          calculatedPerformanceFeeAmount =
            (inputs.monthlyVolume * actualFeeValueUsedInCalculation) / 100;
          break;
        case 'bundle-snipe':
          if (selectedPerformanceOption.type === 'tokens') {
            calculatedPerformanceFeeAmount =
              (inputs.tokenValue * actualFeeValueUsedInCalculation) / 100;
          } else if (selectedPerformanceOption.type === 'profit') {
            const profit = inputs.tokenValue * 0.3; // Assuming 30% profit margin
            calculatedPerformanceFeeAmount =
              (profit * actualFeeValueUsedInCalculation) / 100;
          }
          break;
        case 'distribution':
          if (selectedPerformanceOption.type === 'tokens') {
            calculatedPerformanceFeeAmount =
              (inputs.tokenValue * actualFeeValueUsedInCalculation) / 100;
          } else if (selectedPerformanceOption.type === 'flat') {
            calculatedPerformanceFeeAmount =
              inputs.walletCount * actualFeeValueUsedInCalculation;
            // For flat fee, calculate an effective percentage for display/chart if needed
            if (inputs.tokenValue > 0) {
              actualFeeValueUsedInCalculation =
                (calculatedPerformanceFeeAmount / inputs.tokenValue) * 100;
            } else {
              actualFeeValueUsedInCalculation = 0;
            }
          }
          break;
      }

      performanceFees.push({
        botId,
        feeAmount: calculatedPerformanceFeeAmount,
        feePercentage: actualFeeValueUsedInCalculation,
        description: selectedPerformanceOption.description,
      });
    });

    const monthlyDailyFees = dailyFeesTotal;
    const totalPerformanceFees = performanceFees.reduce(
      (sum, fee) => sum + fee.feeAmount,
      0
    );

    let currentTotalMonthlyFees =
      monthlyDailyFees + totalPerformanceFees + setupFee / 12;
    let currentTotalAnnualFees = currentTotalMonthlyFees * 12;

    // --- Apply Fee Caps (from globalFeesForCapsAndSetup) ---
    if (
      globalFeesForCapsAndSetup?.dailyFeeCap !== undefined &&
      globalFeesForCapsAndSetup.dailyFeeCap > 0
    ) {
      const monthlyDailyFeeCap = globalFeesForCapsAndSetup.dailyFeeCap * 30;
      if (monthlyDailyFees > monthlyDailyFeeCap) {
        currentTotalMonthlyFees =
          monthlyDailyFeeCap + totalPerformanceFees + setupFee / 12;
        currentTotalAnnualFees = currentTotalMonthlyFees * 12;
      }
    }

    if (
      globalFeesForCapsAndSetup?.monthlyFeeCap !== undefined &&
      globalFeesForCapsAndSetup.monthlyFeeCap > 0
    ) {
      if (currentTotalMonthlyFees > globalFeesForCapsAndSetup.monthlyFeeCap) {
        currentTotalMonthlyFees = globalFeesForCapsAndSetup.monthlyFeeCap;
        currentTotalAnnualFees = currentTotalMonthlyFees * 12;
      }
    }

    const totalMonthlyFeesAllProjects = currentTotalMonthlyFees * projectCount;
    const totalAnnualFeesAllProjects = currentTotalAnnualFees * projectCount;

    return {
      setupFee: setupFee,
      dailyFees: dailyFeesTotal,
      monthlyDailyFees: monthlyDailyFees,
      performanceFees,
      totalMonthlyFees: currentTotalMonthlyFees,
      totalAnnualFees: currentTotalAnnualFees,
      savingsFromEarlyAdoption: 0,
      totalMonthlyFeesAllProjects: totalMonthlyFeesAllProjects,
      totalAnnualFeesAllProjects: totalAnnualFeesAllProjects,
    };
  };

  // Effect to recalculate fees whenever relevant state changes
  useEffect(() => {
    if (botConfigs.length > 0 && !isLoadingGlobalFees && !globalFeesError) {
      const newCalculations = calculateFees(botConfigs);
      setCalculations(newCalculations);
    } else if (configsError) {
      console.error(
        'Primary error fetching bot configs for calculator, calculations might be incomplete:',
        configsError
      );
    } else if (globalFeesError) {
      console.warn(
        'Error fetching global fees for caps/setup, using defaults for those fields.',
        globalFeesError
      );
    }
  }, [
    selectedBots,
    botInputs,
    performanceFeeOptionsState,
    projectCount,
    botConfigs, // Now a state variable, used as dependency
    globalFeesForCapsAndSetup, // Global fees for setup/caps
    isLoadingGlobalFees,
    globalFeesError,
    configsError,
  ]);

  // Handle loading states
  if (isLoadingConfigs || isLoadingGlobalFees) {
    return (
      <Card className="w-fit min-h-[600px] flex items-center justify-center">
        <div>Loading pricing configurations...</div>
      </Card>
    );
  }

  // Handle error state if no data could be loaded
  if (configsError && !botConfigs.length) {
    // Check botConfigs.length as well
    return (
      <Card className="w-fit min-h-[600px] flex items-center justify-center text-red-500">
        Error loading calculator data: {configsError.message}. Please try again
        later.
      </Card>
    );
  }

  // Handle case where no bot configurations are available (e.g., empty array from backend)
  if (!botConfigs || botConfigs.length === 0) {
    return (
      <Card className="w-fit min-h-[600px] flex items-center justify-center">
        <div>
          No bot configurations available. Please ensure backend data is
          configured.
        </div>
      </Card>
    );
  }

  // Extract specific bot configs for direct JSX rendering
  // These are guaranteed to exist because of the checks above
  const liquidationBot = botConfigs.find((b) => b.id === 'liquidation')!;
  const volumeBot = botConfigs.find((b) => b.id === 'volume')!;
  const bundleSnipeBot = botConfigs.find((b) => b.id === 'bundle-snipe')!;
  const distributionBot = botConfigs.find((b) => b.id === 'distribution')!;

  return (
    <Card className="w-fit ">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold font-tt">
              Valmira Fee Calculator
            </CardTitle>
            <CardDescription className="text-sm">
              Estimate your costs based on your project needs
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="!py-0">
        <Tabs defaultValue="bots" className="space-y-4 !pt-0">
          <TabsList className="grid grid-cols-3 mb-0 w-full sm:w-fit">
            <TabsTrigger
              value="bots"
              className="text-xs sm:text-sm flex-1 sm:flex-none px-2 sm:px-4"
            >
              <Calculator className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Select Bots</span>
              <span className="sm:hidden">Bots</span>
            </TabsTrigger>
            <TabsTrigger
              value="breakdown"
              className="text-xs sm:text-sm flex-1 sm:flex-none px-2 sm:px-4"
            >
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Fee Breakdown</span>
              <span className="sm:hidden">Fees</span>
            </TabsTrigger>
            <TabsTrigger
              value="chart"
              className="text-xs sm:text-sm flex-1 sm:flex-none px-2 sm:px-4"
            >
              <PieChart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Cost Visuals</span>
              <span className="sm:hidden">Chart</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bots" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Explicitly render each bot card */}
              <BotCard
                bot={liquidationBot}
                isSelected={selectedBots.includes('liquidation')}
                toggleBot={toggleBot}
                botInputs={botInputs}
                updateBotInput={updateBotInput}
                performanceFeeOptionsState={performanceFeeOptionsState}
                updatePerformanceFeeOption={updatePerformanceFeeOption}
              />
              <BotCard
                bot={volumeBot}
                isSelected={selectedBots.includes('volume')}
                toggleBot={toggleBot}
                botInputs={botInputs}
                updateBotInput={updateBotInput}
                performanceFeeOptionsState={performanceFeeOptionsState}
                updatePerformanceFeeOption={updatePerformanceFeeOption}
              />
              <BotCard
                bot={bundleSnipeBot}
                isSelected={selectedBots.includes('bundle-snipe')}
                toggleBot={toggleBot}
                botInputs={botInputs}
                updateBotInput={updateBotInput}
                performanceFeeOptionsState={performanceFeeOptionsState}
                updatePerformanceFeeOption={updatePerformanceFeeOption}
              />
              <BotCard
                bot={distributionBot}
                isSelected={selectedBots.includes('distribution')}
                toggleBot={toggleBot}
                botInputs={botInputs}
                updateBotInput={updateBotInput}
                performanceFeeOptionsState={performanceFeeOptionsState}
                updatePerformanceFeeOption={updatePerformanceFeeOption}
              />
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <FeeBreakdown
              calculations={calculations}
              selectedBots={selectedBots}
              botConfigs={botConfigs} // Pass the state variable here
              _projectCount={projectCount}
              globalFees={globalFeesForCapsAndSetup}
              botInputs={botInputs}
            />
          </TabsContent>

          <TabsContent value="chart" className="space-y-4">
            <MonthlyCostChart
              calculations={calculations}
              selectedBots={selectedBots}
              botConfigs={botConfigs} // Pass the state variable here
              _projectCount={projectCount}
              globalFees={globalFeesForCapsAndSetup}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 !pt-4 ">
        <div className="w-full ">
          <Card className="p-4 space-y-2 rounded-xl w-full bg-muted ">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold font-tt">
                  Number of project
                </h3>
                <p className="text-sm text-muted-foreground">
                  Based on your selections and usage
                </p>
              </div>
              <div className="flex items-center justify-evenly space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-md w-8 h-8"
                  onClick={() =>
                    updateProjectCount(Math.max(1, projectCount - 1))
                  }
                >
                  –
                </Button>
                <span className="text-lg font-normal ">{projectCount}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-md w-8 h-8"
                  onClick={() => updateProjectCount(projectCount + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <hr />

            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-semibold font-tt">
                  Total of {projectCount} Projects
                </h3>
                <p className="text-sm text-muted-foreground">
                  Combined monthly cost
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-tt font-semibold ">
                  {formatCurrency(calculations.totalMonthlyFeesAllProjects)}
                </p>
                <p className="text-sm text-muted-foreground">/ Month Total</p>
              </div>
            </div>

            <hr />

            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-semibold font-tt">
                  Estimated Monthly Cost
                </h3>
                <p className="text-sm text-muted-foreground">
                  Based on your selections and usage
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold font-tt">
                  {formatCurrency(calculations.totalMonthlyFees)}
                </p>
                <p className="text-sm text-muted-foreground">
                  / Month per project
                </p>
              </div>
            </div>

            <hr />

            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-semibold font-tt">
                  Annual Estimate
                </h3>
                <p className="text-sm text-muted-foreground">
                  Projected annual cost
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold font-tt">
                  {formatCurrency(calculations.totalAnnualFees)}
                </p>
                <p className="text-sm text-muted-foreground">
                  / Year per project
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row justify-center w-full text-sm text-muted-foreground pt-2"></div>
      </CardFooter>
    </Card>
  );
}
