'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ethers } from 'ethers';
import {
  ArrowRightLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Flame,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useAccount, useChainId } from 'wagmi';

import { ApproveAndAddLiquidityButtons } from '@/components/projects/ApproveAndAddLiquidityButtons';
import { BnbDepositDialog } from '@/components/projects/bnb-deposit-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
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
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useEthersSigner } from '@/lib/ether-adapter';
import { BotService } from '@/services/botService';
import { projectService } from '@/services/projectService';
import { walletApi } from '@/services/walletApi';
import {
  burnLiquidity,
  calculateSnipeAmount as calculatePoolSnipeAmount,
  getLPTokenBalance,
  getPoolInfo,
  getWalletBalances as getWeb3WalletBalances,
  removeLiquidity,
} from '@/services/web3Utils';
import { generateWallets, getWalletBalances } from '@/store/slices/walletSlice';
import type { AppDispatch, RootState } from '@/store/store';
import type { Project, ProjectWithAddons } from '@/types';
import type { ProjectState } from '@/types';

// Types from the original component
interface SubWallet {
  _id: string;
  publicKey: string;
  role: string;
}

export interface WalletInfo {
  _id?: string;
  publicKey: string;
  role: string;
  bnbNeeded?: number;
  bnbToSpend?: number;
  bnbBalance?: number;
  tokenAmount?: number;
  tokenBalance?: number;
  insufficientBnb?: number;
  sellPercentage?: number;
  isSelectedForMutilSell?: boolean;
  privateKey?: string; // Add privateKey property
  bnbSpendRate?: number; // Add bnbSpendRate property (percentage of wallet balance to use for buying)
}

interface LiquidationSnipeBotAddon {
  subWalletIds: SubWallet[];
  depositWalletId?: {
    publicKey: string;
    _id: string;
  };
  _id: string;
}

type FeeEstimationResult = {
  bnbForDistribution: number;
  wallets: WalletInfo[];
  totalBnbNeeded: number;
  addLiquidityBnb?: number;
  snipingBnb: number;
  tipBnb?: number;
  gasCost?: number;
  currentBnbBalance: number;
  currentTokenBalance: number;
  tokenAmountRequired?: number;
  sufficientBalance: boolean;
  gasDetails?: {
    tipTransactionGas?: number;
    addLiquidityGas?: number;
    openTradingGas?: number;
    snipeGas?: number;
    distributionGas?: number;
  };
  poolSimulation?: {
    initialReserves?: {
      bnb: number;
      token: number;
    };
    finalReserves?: {
      bnb: number;
      token: number;
    };
    priceImpact?: number;
  };
};

interface ExtendedProject extends Project {
  addons: {
    SnipeBot: LiquidationSnipeBotAddon;
    [key: string]: any;
  };
  totalSupply?: string;
  tokenAddress: string;
  symbol: string;
  isImported?: boolean;
  explorerUrl?: string;
}

// Add type guard function
function isProjectWithAddons(
  project: Project | ProjectWithAddons
): project is ProjectWithAddons {
  return 'addons' in project;
}

interface PoolInfo {
  bnbReserve: number;
  tokenReserve: number;
  tokenAddress: string;
  bnbAddress: string;
}

interface FailedTransaction {
  wallet: string;
  walletAddress?: string;
  retries: number;
  error: string;
  type: string;
  details: {
    required: string;
    available: string;
  };
}

interface MultiSellResult {
  success: boolean;
  totalWallets: number;
  successfulTransactions: number;
  failedTransactions: number;
  receipts: any[];
  errors: FailedTransaction[];
  error?: string;
}

type SnipeWizardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Define new preset strategy types
export enum PresetStrategy {
  RAPID_SNIPE = 'rapid_snipe',
  STAGGERED_SNIPE = 'staggered_snipe',
  PASSIVE_EARLY_BUY = 'passive_early_buy',
}

export interface PresetConfig {
  strategy: PresetStrategy;
  targetShare?: number; // Percentage of total supply to aim for
  totalShare?: number; // Total percentage for staggered snipe
  targetTokenAmount?: number; // Specific token amount to buy
  numberOfWallets: number;
  minWallets?: number; // Min wallets for staggered snipe
  maxWallets?: number; // Max wallets for staggered snipe
  timeFrame: string; // e.g., "within first 30 minutes of launch" or "only at TGE block"
  maxPriceImpact?: number; // Max price impact allowed
  maxSlippage?: number; // Max slippage allowed
  buyStageDuration?: string; // Time between buys for staggered snipe
  buyStageCounts?: number; // Number of buy stages for staggered snipe
  priceThreshold?: number; // Price threshold for passive early buy
}

// Define the wizard steps
enum WizardStep {
  INTRODUCTION = 0,
  MODE_SELECTION = 1, // New step for mode selection
  PRESET_CONFIGURATION = 2, // New step for preset configuration
  LIQUIDITY_MANAGEMENT = 3,
  WALLET_SETUP = 4,
  SNIPE_CONFIGURATION = 5,
  FEE_DISTRIBUTION = 6,
  SIMULATION = 7,
  EXECUTION = 8,
  POST_OPERATION = 9,
}

export function BundleSnipingDialog({
  open,
  onOpenChange,
}: SnipeWizardDialogProps) {
  // then read project id from url
  const { id: projectId } = useParams();

  // Track the current wizard step
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    WizardStep.INTRODUCTION
  );

  // Mode selection state
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Preset configuration state
  const [presetConfig, setPresetConfig] = useState<PresetConfig>({
    strategy: PresetStrategy.RAPID_SNIPE,
    targetShare: 70, // Default to 70%
    totalShare: 70, // Default total share for staggered snipe
    numberOfWallets: 40,
    minWallets: 5, // Default for staggered snipe
    maxWallets: 20, // Default for staggered snipe
    timeFrame: 'only at TGE block', // Default for Rapid Snipe
    maxPriceImpact: 50, // Default for Rapid Snipe
    maxSlippage: 3, // Default for Passive Early Buy
    buyStageDuration: 'medium', // Default for Staggered Snipe
    buyStageCounts: 3, // Default for Staggered Snipe
    priceThreshold: 0.00001, // Default for Passive Early Buy (in BNB)
  });

  // Price threshold unit state
  const [priceThresholdUnit, setPriceThresholdUnit] = useState('BNB');

  // Amount type toggles for percentage vs direct token amount
  const [targetAmountType, setTargetAmountType] = useState('percentage');
  const [totalAmountType, setTotalAmountType] = useState('percentage');

  // Advanced mode configuration state
  const [advancedConfig, setAdvancedConfig] = useState({
    snipePhases: [
      { name: 'TGE Snipe', percentage: 70, priorityFee: 'high' },
      { name: 'Post-Launch', percentage: 20, priorityFee: 'medium' },
      { name: 'Marketing Surge', percentage: 10, priorityFee: 'low' },
    ],
    timing: {
      waitBlocks: 0,
      randomTimeOffset: { min: 3, max: 15 }, // seconds
      pauseOnPriceSpike: true,
      priceSpikeTrigger: 20, // %
    },
    stealth: {
      splitBuys: true,
      randomChunks: { min: 3, max: 7 },
      distributeAfterSnipe: false,
    },
    postSnipe: {
      enableAutoSell: false,
      autoSellThreshold: 200, // % profit
      autoSellPercentage: 50, // % of holdings
      passToDistributionBot: false,
    },
  });

  // Fix unused setPriorityFeeSettings state
  const [priorityFeeSettings, _setPriorityFeeSettings] = useState({
    normal: 1.0, // Gwei
    medium: 2.0, // Gwei
    high: 5.0, // Gwei
    max: 10.0, // Gwei
    useHigherOnCongestion: true,
  });

  // Fix unused setOperationStatus state
  const [_operationStatus, _setOperationStatus] = useState({
    status: 'idle', // idle, preparing, executing, completed, failed
    tokensSnipedSoFar: 0,
    targetTokens: 0,
    walletsUsed: 0,
    totalWallets: 0,
    feesSpent: 0,
    currentPhase: '',
    logs: [] as {
      time: string;
      message: string;
      type: 'info' | 'success' | 'error' | 'warning';
    }[],
  });

  // State from the original component (we'll maintain the same state variables)
  const dispatch = useDispatch<AppDispatch>();
  const { currentProject, loading: isProjectLoading } = useSelector(
    (state: RootState) => state.projects as ProjectState
  );

  // Initialize project state
  const [project, setProject] = useState<ExtendedProject | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  const fetchAndFillDetailedProejct = async (projectId: string) => {
    try {
      setIsLoadingProject(true);
      const project = await projectService.getProject(projectId as string);
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

  // Effect to update project when currentProject changes
  useEffect(() => {
    if (!currentProject) return;

    try {
      if (!isProjectWithAddons(currentProject)) {
        throw new Error('Current project does not have addons');
      }

      const convertedProject: ExtendedProject = {
        ...currentProject,
        userId: '',
        status: currentProject.status === 'active' ? 'active' : 'inactive',
        addons: {
          SnipeBot: {
            _id: currentProject.addons.SnipeBot?._id || '',
            subWalletIds: (
              currentProject.addons.SnipeBot?.subWalletIds || []
            ).map((w) => ({
              _id: w?._id || '',
              publicKey: w.publicKey || '',
              role: w?.role || 'botsub',
            })),
            depositWalletId: currentProject.addons.SnipeBot?.depositWalletId
              ? {
                  _id: currentProject.addons.SnipeBot.depositWalletId._id || '',
                  publicKey:
                    currentProject.addons.SnipeBot.depositWalletId.publicKey ||
                    '',
                }
              : undefined,
          },
        },
        tokenAddress: currentProject.tokenAddress || '',
        symbol: currentProject.symbol || '',
        totalSupply: currentProject.totalSupply?.toString(),
      } as ExtendedProject;

      setProject(convertedProject);
    } catch (error) {
      console.error('Error converting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive',
      });
    }
  }, [currentProject]);

  // Helper function to safely get token address
  const getTokenAddress = (): string => {
    if (isLoadingProject) {
      throw new Error('Project data is still loading');
    }
    if (!project) {
      throw new Error('Project not found');
    }
    if (!project.tokenAddress) {
      throw new Error('Token address is required');
    }
    return project.tokenAddress;
  };

  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [isGenerating, _setIsGenerating] = useState(false);
  const [walletCount, setWalletCount] = useState(
    String(project?.addons?.SnipeBot?.subWalletIds?.length || 5)
  ); // Add string type for walletCount
  const [snipePercentage, setSnipePercentage] = useState(50);
  const [_isBnbDistributed, setIsBnbDistributed] = useState(false);
  const [feeEstimationResult, setFeeEstimationResult] =
    useState<FeeEstimationResult | null>(null);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [doAddLiquidity, _setDoAddLiquidity] = useState(true);
  const [liquidityBnbAmount, setLiquidityBnbAmount] = useState(0);
  const [liquidityTokenAmount, setLiquidityTokenAmount] = useState(0);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [isLoadingPoolInfo, setIsLoadingPoolInfo] = useState(false);
  const { toast } = useToast();
  const _balanceUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const lastBalanceUpdateRef = useRef<number>(0);
  const MIN_BALANCE_UPDATE_INTERVAL = 5000; // Minimum 5 seconds between balance updates
  const [isEstimatingFees, setIsEstimatingFees] = useState(false);
  const [isDistributingBNBs, setIsDistributingBNBs] = useState(false);
  const [distributeAmount, setDistributeAmount] = useState<number>(0.001);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [estimationResult, setEstimationResult] = useState<any>(null);
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const chainId = useChainId();
  const signer = useEthersSigner({ chainId: chainId || 56 });
  const { address } = useAccount();
  const [connectedWalletBalance, setConnectedWalletBalance] = useState<{
    bnb: number;
    token: number;
  }>({ bnb: 0, token: 0 });
  const [isLoadingConnectedWalletBalance, setIsLoadingConnectedWalletBalance] =
    useState(false);
  const [isOpenBnbDepositDialog, setIsOpenBnbDepositDialog] = useState(false);
  const [depositWalletBalance, setDepositWalletBalance] = useState<
    number | null
  >(null);
  const [isLoadingDepositWalletBalance, setIsLoadingDepositWalletBalance] =
    useState(false);
  const [lpTokenBalance, setLpTokenBalance] = useState<number>(0);
  const [isLoadingLpBalance, setIsLoadingLpBalance] = useState(false);
  const [isBurningLiquidity, setIsBurningLiquidity] = useState(false);
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false);
  const [removePercentage, setRemovePercentage] = useState(100);
  const [insufficientFundsDetails, setInsufficientFundsDetails] = useState<{
    walletAddress: string;
    walletType: string;
    availableBnb: number;
    requiredBnb: number;
    missingBnb: number;
  } | null>(null);
  const [executingSingleSells, setExecutingSingleSells] = useState<
    Record<string, boolean>
  >({});
  const [isExecutingMultiSell, setIsExecutingMultiSell] = useState(false);
  const [slippageTolerance, setSlippageTolerance] = useState(99);
  const [isCollectingBnb, setIsCollectingBnb] = useState(false);
  const balanceFetchInProgressRef = useRef(false);
  const lpTokenFetchInProgressRef = useRef(false);
  const [executingSingleBuys, setExecutingSingleBuys] = useState<
    Record<string, boolean>
  >({});
  const [isExecutingMultiBuy, setIsExecutingMultiBuy] = useState(false);

  const [_generatingWallets, setGeneratingWallets] = useState(false);
  const [_isEstimating, setIsEstimating] = useState(false);

  // Add a ref to track if we've loaded the project
  const hasLoadedProjectRef = useRef(false);

  // Reset to first step when dialog opens and load project if needed
  useEffect(() => {
    if (open) {
      setCurrentStep(WizardStep.INTRODUCTION);
      setIsAdvancedMode(false); // Reset to preset mode by default

      // If we have a projectId and haven't loaded the project yet
      if (
        projectId &&
        !Array.isArray(projectId) &&
        !hasLoadedProjectRef.current &&
        !isLoadingProject
      ) {
        fetchAndFillDetailedProejct(projectId as string);
        hasLoadedProjectRef.current = true;
      }
    } else {
      // Reset the flag when the dialog closes
      hasLoadedProjectRef.current = false;
    }
  }, [open, projectId]);

  // Effect to fetch deposit wallet balance when on preset configuration step
  useEffect(() => {
    if (
      currentStep === WizardStep.PRESET_CONFIGURATION &&
      project?.addons?.SnipeBot?.depositWalletId?.publicKey
    ) {
      fetchDepositWalletBalance();
    }
  }, [currentStep, project?.addons?.SnipeBot?.depositWalletId?.publicKey]);

  // Step navigation functions
  const goToNextStep = () => {
    // Skip the preset configuration step if in advanced mode and we're at mode selection
    if (isAdvancedMode && currentStep === WizardStep.MODE_SELECTION) {
      setCurrentStep(WizardStep.LIQUIDITY_MANAGEMENT);
      return;
    }

    // Navigate to the normal next step
    if (currentStep < WizardStep.POST_OPERATION) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    // Skip the preset configuration step if in advanced mode and we're at liquidity management
    if (isAdvancedMode && currentStep === WizardStep.LIQUIDITY_MANAGEMENT) {
      setCurrentStep(WizardStep.MODE_SELECTION);
      return;
    }

    if (currentStep > WizardStep.INTRODUCTION) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Render the appropriate content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.INTRODUCTION:
        return renderIntroductionStep();
      case WizardStep.MODE_SELECTION:
        return renderModeSelectionStep();
      case WizardStep.PRESET_CONFIGURATION:
        return renderPresetConfigurationStep();
      case WizardStep.LIQUIDITY_MANAGEMENT:
        return renderLiquidityManagementStep();
      case WizardStep.WALLET_SETUP:
        return renderWalletSetupStep();
      case WizardStep.SNIPE_CONFIGURATION:
        return renderSnipeConfigurationStep();
      case WizardStep.FEE_DISTRIBUTION:
        return renderFeeDistributionStep();
      case WizardStep.SIMULATION:
        return renderSimulationStep();
      case WizardStep.EXECUTION:
        return renderExecutionStep();
      case WizardStep.POST_OPERATION:
        return renderPostOperationStep();
      default:
        return renderIntroductionStep();
    }
  };

  // Implement the mode selection step
  const renderModeSelectionStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardDescription>
          Automate token launch sniping to secure a large supply before
          distribution or liquidation. Choose a quick preset or customize
          advanced parameters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-center p-4 border rounded-lg">
            <div className="grid grid-cols-2 w-full max-w-md gap-3">
              <Button
                variant={!isAdvancedMode ? 'default' : 'outline'}
                className="h-16 flex flex-col items-center justify-center"
                onClick={() => setIsAdvancedMode(false)}
              >
                <span className="text-lg font-medium">Preset</span>
                <span className="text-xs">Quick setup with templates</span>
              </Button>
              <Button
                variant={isAdvancedMode ? 'default' : 'outline'}
                className="h-16 flex flex-col items-center justify-center"
                onClick={() => setIsAdvancedMode(true)}
              >
                <span className="text-lg font-medium">Advanced</span>
                <span className="text-xs">Full customization</span>
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-3">Mode Description</h3>
            {!isAdvancedMode ? (
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  <strong>Preset Mode</strong> offers pre-configured strategies
                  for straightforward sniping operations:
                </p>
                <ul className="list-disc ml-5 space-y-2">
                  <li>
                    <strong>Rapid Snipe:</strong> Quickly buy up a large portion
                    of the supply at launch
                  </li>
                  <li>
                    <strong>Staggered Snipe:</strong> Snipe in multiple bursts
                    over time, appearing less suspicious
                  </li>
                  <li>
                    <strong>Passive Early Buy:</strong> Buy a moderate portion
                    only if the price remains under a threshold
                  </li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  <strong>Advanced Mode</strong> gives you full control over:
                </p>
                <ul className="list-disc ml-5 space-y-2">
                  <li>Wallet setup and multi-wallet distribution</li>
                  <li>Precise timing and launch detection parameters</li>
                  <li>Bribe/priority fees for faster transactions</li>
                  <li>Target token amount and budget constraints</li>
                  <li>Stealth features for organic appearance on-chain</li>
                  <li>
                    Post-snipe distribution and integration with other bots
                  </li>
                </ul>
              </div>
            )}
          </div>

          {renderNavigationFooter(
            false,
            false,
            `Continue with ${isAdvancedMode ? 'Advanced' : 'Preset'} Mode`
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Placeholder render functions for each step
  const renderIntroductionStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Choose Preferred Mode</CardTitle>
        <CardDescription>
          Automate token launch sniping to secure a large supply before
          distribution or liquidation. Choose a quick preset or customize
          advanced parameters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  1
                </span>
                <div>
                  <h3 className="font-medium">Choose Your Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Select between Preset or Advanced configuration mode.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  2
                </span>
                <div>
                  <h3 className="font-medium">Configure Your Snipe</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up wallets, amounts, and timing for your token snipe.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  3
                </span>
                <div>
                  <h3 className="font-medium">Execute & Manage</h3>
                  <p className="text-sm text-muted-foreground">
                    Run the operation and handle your acquired tokens afterward.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <h4 className="text-amber-800 font-medium">Before you start:</h4>
            <ul className="list-disc pl-6 text-amber-700 mt-2">
              <li>Make sure your wallet is connected and has sufficient BNB</li>
              <li>Ensure your token contract is properly configured</li>
              <li>Consider the risks involved in token sniping operations</li>
            </ul>
          </div>

          {renderNavigationFooter(false, true, 'Get Started')}
        </div>
      </CardContent>
    </Card>
  );

  const renderWalletSetupStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Wallet Setup</CardTitle>
        <CardDescription>
          Configure and manage the wallets that will be used for sniping
          operations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Deposit Wallet Info */}
          {project?.addons.SnipeBot.depositWalletId?.publicKey && (
            <div className="border-2 border-dashed rounded-lg p-4 bg-muted/10">
              <h3 className="text-base font-medium mb-2">Deposit Wallet</h3>
              <div className="flex items-center gap-2 mb-3">
                <code className="text-sm font-mono bg-muted/30 p-1 rounded">
                  {project?.addons.SnipeBot.depositWalletId.publicKey.slice(
                    0,
                    6
                  )}
                  ...
                  {project?.addons.SnipeBot.depositWalletId.publicKey.slice(-4)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    project?.addons.SnipeBot.depositWalletId &&
                    copyToClipboard(
                      project?.addons.SnipeBot.depositWalletId.publicKey
                    )
                  }
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy address</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a
                    href={`https://bscscan.com/address/${project?.addons.SnipeBot.depositWalletId.publicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View on Explorer</span>
                  </a>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    BNB Balance:
                  </p>
                  <p className="font-medium">
                    {wallets
                      .find((w) => w.role === 'botmain')
                      ?.bnbBalance?.toFixed(4) || '0.0000'}{' '}
                    BNB
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Token Balance:
                  </p>
                  <p className="font-medium">
                    {wallets
                      .find((w) => w.role === 'botmain')
                      ?.tokenBalance?.toFixed(4) || '0.0000'}{' '}
                    {project?.symbol || 'tokens'}
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mt-4 text-blue-700 text-sm">
                <p>
                  💡 The deposit wallet is the main wallet that holds your
                  funds. BNB from this wallet will be distributed to your
                  sniping wallets.
                </p>
              </div>
            </div>
          )}

          {/* Wallet Management Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-3">Sniping Wallets</h3>

            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="walletCount"
                  className="text-sm whitespace-nowrap"
                >
                  Number of wallets:
                </Label>
                <Input
                  id="walletCount"
                  type="number"
                  className="h-8 w-20"
                  value={walletCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (value > 50) {
                      toast({
                        title: 'Maximum Wallet Count Exceeded',
                        description:
                          'The maximum number of wallets allowed is 50.',
                        variant: 'destructive',
                      });
                      setWalletCount('50');
                      return;
                    }
                    setWalletCount(e.target.value);
                    setIsBnbDistributed(false);
                  }}
                  min="1"
                  max="50"
                />
              </div>

              <Button
                onClick={() => handleGenerateWallets()}
                disabled={isGenerating || isProjectLoading}
                className="h-8"
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {project?.addons?.SnipeBot?.subWalletIds?.length
                      ? 'Updating...'
                      : 'Creating...'}
                  </>
                ) : (
                  <>
                    {project?.addons?.SnipeBot?.subWalletIds?.length
                      ? 'Update Wallets'
                      : 'Create Wallets'}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  const allAddresses = [
                    ...(project?.addons.SnipeBot.depositWalletId?.publicKey
                      ? [project?.addons.SnipeBot.depositWalletId.publicKey]
                      : []),
                    ...wallets
                      .filter((w) => w.role !== 'botmain')
                      .map((w) => w.publicKey),
                  ];
                  fetchBalances(allAddresses);
                }}
                disabled={isLoadingBalances}
              >
                {isLoadingBalances ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Balances
              </Button>
            </div>

            <div className="text-xs text-muted-foreground mb-4">
              You can create up to 50 sniping wallets. Each wallet will be used
              to snipe tokens during execution.
            </div>

            {/* Wallets Table */}
            <div className="overflow-x-auto border rounded-lg">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[10%]">No</TableHead>
                      <TableHead className="w-[200px]">Address</TableHead>
                      <TableHead className=" text-right">BNB</TableHead>
                      <TableHead className=" text-right">Tokens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets
                      .filter((w) => w.role !== 'botmain')
                      .map((wallet, _index) => (
                        <TableRow key={wallet.publicKey}>
                          <TableCell className="text-left">
                            {_index + 1}
                          </TableCell>
                          <TableCell className="font-mono">
                            <div className="flex items-center gap-1">
                              {wallet.publicKey.slice(0, 6)}...
                              {wallet.publicKey.slice(-4)}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  copyToClipboard(wallet.publicKey)
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {(wallet.bnbBalance || 0).toFixed(4)}
                          </TableCell>
                          <TableCell className="text-right">
                            {(wallet.tokenBalance || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-muted/20 rounded-lg p-4">
            <h3 className="text-base font-medium mb-2">How it works</h3>
            <ol className="list-decimal ml-5 space-y-2 text-sm">
              <li>
                Create multiple sniping wallets to distribute your sniping
                operation
              </li>
              <li>
                Later, you'll distribute BNB from your deposit wallet to these
                sniping wallets
              </li>
              <li>
                During the sniping operation, each wallet will buy tokens
                independently
              </li>
              <li>
                Using multiple wallets helps avoid large price impacts and makes
                your operation more stealthy
              </li>
            </ol>
          </div>
        </div>
        {renderNavigationFooter()}
      </CardContent>
    </Card>
  );

  const renderLiquidityManagementStep = () => {
    if (isLoadingProject) {
      return (
        <Card className="border-none shadow-none">
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading project data...</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!project?.tokenAddress) {
      return (
        <Card className="border-none shadow-none">
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground">
                Project data not found or token address is missing.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  if (
                    projectId &&
                    !Array.isArray(projectId) &&
                    !isLoadingProject
                  ) {
                    fetchAndFillDetailedProejct(projectId);
                    hasLoadedProjectRef.current = true;
                  }
                }}
                disabled={isLoadingProject}
              >
                {isLoadingProject ? (
                  <div className="flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Retry Loading'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Liquidity Management (optional)</CardTitle>
          <CardDescription>
            Add or remove liquidity from the token pool (optional step).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Connected Wallet Information */}
            {address && (
              <div className="border rounded-lg p-4 bg-muted/10">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-medium">Connected Wallet</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      fetchConnectedWalletBalance();
                      fetchLpTokenBalance();
                    }}
                    disabled={
                      isLoadingConnectedWalletBalance || isLoadingLpBalance
                    }
                    className="h-6 px-2"
                  >
                    {isLoadingConnectedWalletBalance || isLoadingLpBalance ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    <span className="text-xs">Refresh</span>
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      BNB Balance:
                    </span>
                    <span className="font-medium">
                      {connectedWalletBalance.bnb.toFixed(4)} BNB
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Token Balance:
                    </span>
                    <span className="font-medium">
                      {connectedWalletBalance.token.toLocaleString()}{' '}
                      {project?.symbol}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      LP Token Balance:
                    </span>
                    <span className="font-medium">
                      {lpTokenBalance.toLocaleString()} LP
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Address:
                  </span>
                  <code className="text-xs font-mono bg-muted/20 px-1 py-0.5 rounded">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => copyToClipboard(address)}
                  >
                    <Copy className="h-3 w-3" />
                    <span className="sr-only">Copy address</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Pool Information */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-medium">Pool Information</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchPoolInfo}
                  disabled={isLoadingPoolInfo}
                  className="h-6 px-2"
                >
                  {isLoadingPoolInfo ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  <span className="text-xs">Refresh</span>
                </Button>
              </div>

              {poolInfo ? (
                <div className="grid grid-cols-2 gap-4 mb-2 p-3 bg-muted/10 rounded-md">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      BNB in Pool:
                    </span>
                    <span className="font-medium">
                      {poolInfo?.bnbReserve?.toFixed(4)} BNB
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Tokens in Pool:
                    </span>
                    <span className="font-medium">
                      {poolInfo?.tokenReserve?.toLocaleString()}{' '}
                      {project?.symbol}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-muted/10 rounded-md">
                  {isLoadingPoolInfo ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">
                        Loading pool information...
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {project?.tokenAddress
                        ? 'No liquidity pool found. You can add initial liquidity below.'
                        : 'Connect a token to view pool information.'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Add Liquidity Section */}
            <div className="border rounded-lg p-4">
              <h3 className="text-base font-medium mb-2">Add Liquidity</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Adding liquidity creates a trading pair for your token on
                PancakeSwap, allowing users to trade it.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BNB Amount */}
                <div>
                  <div className="flex w-full justify-between items-center mb-1">
                    <Label htmlFor="bnbAmount" className="text-xs font-medium">
                      BNB Amount
                    </Label>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-5 text-xs px-1.5"
                        onClick={() => {
                          const maxBnb = connectedWalletBalance.bnb;
                          setLiquidityBnbAmount(
                            Number((maxBnb * 0.1).toFixed(4))
                          );
                        }}
                      >
                        10%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-5 text-xs px-1.5"
                        onClick={() => {
                          const maxBnb = connectedWalletBalance.bnb;
                          setLiquidityBnbAmount(
                            Number((maxBnb * 0.5).toFixed(4))
                          );
                        }}
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-5 text-xs px-1.5"
                        onClick={() => {
                          const maxBnb = connectedWalletBalance.bnb;
                          // Leave a small amount for gas
                          setLiquidityBnbAmount(
                            Number((maxBnb * 0.95).toFixed(4))
                          );
                        }}
                      >
                        Max
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="bnbAmount"
                    type="number"
                    value={liquidityBnbAmount}
                    onChange={(e) =>
                      setLiquidityBnbAmount(Number(e.target.value))
                    }
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                    className="w-full"
                  />
                </div>

                {/* Token Amount */}
                <div>
                  <div className="flex w-full justify-between items-center mb-1">
                    <Label
                      htmlFor="tokenAmount"
                      className="text-xs font-medium"
                    >
                      {project?.symbol || 'Token'} Amount
                    </Label>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-5 text-xs px-1.5"
                        onClick={() => {
                          const maxToken = connectedWalletBalance.token;
                          setLiquidityTokenAmount(
                            Number((maxToken * 0.1).toFixed(0))
                          );
                        }}
                      >
                        10%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-5 text-xs px-1.5"
                        onClick={() => {
                          const maxToken = connectedWalletBalance.token;
                          setLiquidityTokenAmount(
                            Number((maxToken * 0.5).toFixed(0))
                          );
                        }}
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-5 text-xs px-1.5"
                        onClick={() => {
                          const maxToken = connectedWalletBalance.token;
                          setLiquidityTokenAmount(Number(maxToken.toFixed(0)));
                        }}
                      >
                        Max
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="tokenAmount"
                    type="number"
                    value={liquidityTokenAmount}
                    onChange={(e) =>
                      setLiquidityTokenAmount(Number(e.target.value))
                    }
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <ApproveAndAddLiquidityButtons
                  tokenAddress={getTokenAddress()}
                  tokenAmount={liquidityTokenAmount.toString()}
                  bnbAmount={liquidityBnbAmount.toString()}
                  signer={signer || null}
                  onSuccess={() => {
                    if (project?._id) {
                      try {
                        projectService
                          .logLPAddition(
                            project._id,
                            Number(liquidityTokenAmount),
                            Number(liquidityBnbAmount)
                          )
                          .catch((error) => {
                            console.error(
                              'Failed to log LP addition activity:',
                              error
                            );
                          });
                      } catch (error) {
                        console.error(
                          'Failed to log LP addition activity:',
                          error
                        );
                      }
                    }

                    toast({
                      title: 'Success',
                      description: 'Liquidity added successfully',
                    });
                    setLiquidityTokenAmount(0);
                    setLiquidityBnbAmount(0);
                    fetchPoolInfo();
                    fetchConnectedWalletBalance();
                    fetchLpTokenBalance();
                  }}
                />
              </div>
            </div>

            {/* Remove Liquidity Section */}
            <div className="border rounded-lg p-4">
              <h3 className="text-base font-medium mb-2">Remove Liquidity</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You can remove some or all of your liquidity to get back your
                BNB and tokens.
              </p>

              {lpTokenBalance > 0 ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">Remove percentage:</Label>
                      <span className="text-xs font-medium">
                        {removePercentage}%
                      </span>
                    </div>
                    <Slider
                      defaultValue={[100]}
                      max={100}
                      step={1}
                      value={[removePercentage]}
                      onValueChange={(values) => setRemovePercentage(values[0])}
                      disabled={
                        !signer || lpTokenBalance <= 0 || isRemovingLiquidity
                      }
                      className="mb-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={
                        !signer || lpTokenBalance <= 0 || isBurningLiquidity
                      }
                      onClick={handleRemoveLiquidity}
                    >
                      {isRemovingLiquidity ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                      )}
                      Remove {removePercentage}% LP
                    </Button>

                    <Button
                      variant="destructive"
                      disabled={
                        !signer || lpTokenBalance <= 0 || isBurningLiquidity
                      }
                      onClick={handleBurnLiquidity}
                    >
                      {isBurningLiquidity ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Flame className="h-4 w-4 mr-2" />
                      )}
                      Burn All LP
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-muted/10 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    You don't have any LP tokens to remove.
                  </p>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="bg-muted/20 rounded-lg p-4">
              <h3 className="text-base font-medium mb-2">Information</h3>
              <ul className="list-disc ml-5 space-y-2 text-sm">
                <li>
                  Adding liquidity is optional but necessary if no liquidity
                  pool exists yet.
                </li>
                <li>
                  When you add liquidity, you receive LP tokens representing
                  your share of the pool.
                </li>
                <li>
                  You can remove your liquidity at any time to get back your BNB
                  and tokens.
                </li>
                <li>
                  Burning liquidity means removing 100% of your LP tokens.
                </li>
                <li>
                  Approve tokens first if this is your first time adding this
                  token to a liquidity pool.
                </li>
              </ul>
            </div>
          </div>
          {renderNavigationFooter()}
        </CardContent>
      </Card>
    );
  };

  const renderSnipeConfigurationStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-2 sm:px-6 sm:pb-4">
        <CardTitle>Snipe Configuration</CardTitle>
        <CardDescription>
          {isAdvancedMode
            ? 'Configure detailed parameters for your token snipe operation.'
            : 'Configure how much of the token you want to snipe and distribute amounts across your wallets.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Token Information */}
          <div className="border rounded-lg p-4 bg-muted/10">
            <h3 className="text-base font-medium mb-2">Token Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Token Address:
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-muted/20 px-1 py-0.5 rounded truncate max-w-[150px] sm:max-w-[200px]">
                    {project?.tokenAddress}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() =>
                      project?.tokenAddress &&
                      copyToClipboard(project?.tokenAddress)
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Symbol:</p>
                <p className="font-medium">{project?.symbol || 'N/A'}</p>
              </div>
              {poolInfo && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Pool Size:
                    </p>
                    <p className="font-medium">
                      {poolInfo?.tokenReserve?.toLocaleString() || '0'}{' '}
                      {project?.symbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Pool Value:
                    </p>
                    <p className="font-medium">
                      {poolInfo?.bnbReserve?.toFixed(4) || '0'} BNB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Show the mode-specific UI */}
          {isAdvancedMode ? (
            // Advanced Mode UI
            <>
              {/* Phased Approach Configuration */}
              <div className="border rounded-lg p-4">
                <h3 className="text-base font-medium mb-3">
                  Phased Snipe Approach
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure different phases of your snipe operation for maximum
                  effectiveness.
                </p>

                <div className="space-y-4">
                  {advancedConfig.snipePhases.map((phase, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <Input
                            value={phase.name}
                            onChange={(e) => {
                              const newPhases = [...advancedConfig.snipePhases];
                              newPhases[index].name = e.target.value;
                              setAdvancedConfig({
                                ...advancedConfig,
                                snipePhases: newPhases,
                              });
                            }}
                            className="h-7 max-w-[150px]"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`phase-${index}-percentage`}
                            className="text-xs"
                          >
                            Allocation:
                          </Label>
                          <Input
                            id={`phase-${index}-percentage`}
                            value={phase.percentage}
                            onChange={(e) => {
                              const newPhases = [...advancedConfig.snipePhases];
                              newPhases[index].percentage = Number(
                                e.target.value
                              );
                              setAdvancedConfig({
                                ...advancedConfig,
                                snipePhases: newPhases,
                              });
                            }}
                            className="h-7 w-16"
                            type="number"
                            min="0"
                            max="100"
                          />
                          <span className="text-xs">%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        <div>
                          <Label
                            htmlFor={`phase-${index}-priority`}
                            className="text-xs mb-1 block"
                          >
                            Priority Fee:
                          </Label>
                          <select
                            id={`phase-${index}-priority`}
                            value={phase.priorityFee}
                            onChange={(e) => {
                              const newPhases = [...advancedConfig.snipePhases];
                              newPhases[index].priorityFee = e.target.value;
                              setAdvancedConfig({
                                ...advancedConfig,
                                snipePhases: newPhases,
                              });
                            }}
                            className="w-full h-8 rounded-md border px-3 text-sm"
                          >
                            <option value="low">
                              Low ({priorityFeeSettings.normal} Gwei)
                            </option>
                            <option value="medium">
                              Medium ({priorityFeeSettings.medium} Gwei)
                            </option>
                            <option value="high">
                              High ({priorityFeeSettings.high} Gwei)
                            </option>
                            <option value="max">
                              Maximum ({priorityFeeSettings.max} Gwei)
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (advancedConfig.snipePhases.length < 5) {
                          setAdvancedConfig({
                            ...advancedConfig,
                            snipePhases: [
                              ...advancedConfig.snipePhases,
                              {
                                name: `Phase ${advancedConfig.snipePhases.length + 1}`,
                                percentage: 10,
                                priorityFee: 'medium',
                              },
                            ],
                          });
                        } else {
                          toast({
                            title: 'Maximum phases reached',
                            description: 'You can have at most 5 snipe phases',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      Add Phase
                    </Button>
                  </div>
                </div>
              </div>

              {/* Timing & Stealth Configuration */}
              <div className="border rounded-lg p-4">
                <h3 className="text-base font-medium mb-3">
                  Timing & Stealth Options
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Timing Options */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">
                      Timing Configuration
                    </h4>

                    <div>
                      <Label
                        htmlFor="wait-blocks"
                        className="text-xs mb-1 block"
                      >
                        Wait Blocks After Launch:
                      </Label>
                      <Input
                        id="wait-blocks"
                        type="number"
                        value={advancedConfig.timing.waitBlocks}
                        onChange={(e) =>
                          setAdvancedConfig({
                            ...advancedConfig,
                            timing: {
                              ...advancedConfig.timing,
                              waitBlocks: Number(e.target.value),
                            },
                          })
                        }
                        className="h-8"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pause-price-spike"
                        checked={advancedConfig.timing.pauseOnPriceSpike}
                        onCheckedChange={(checked) =>
                          setAdvancedConfig({
                            ...advancedConfig,
                            timing: {
                              ...advancedConfig.timing,
                              pauseOnPriceSpike: checked === true,
                            },
                          })
                        }
                      />
                      <Label htmlFor="pause-price-spike">
                        Pause if price spikes
                      </Label>
                    </div>

                    {advancedConfig.timing.pauseOnPriceSpike && (
                      <div>
                        <Label
                          htmlFor="price-spike-trigger"
                          className="text-xs mb-1 block"
                        >
                          Price Spike Trigger (%):
                        </Label>
                        <Input
                          id="price-spike-trigger"
                          type="number"
                          value={advancedConfig.timing.priceSpikeTrigger}
                          onChange={(e) =>
                            setAdvancedConfig({
                              ...advancedConfig,
                              timing: {
                                ...advancedConfig.timing,
                                priceSpikeTrigger: Number(e.target.value),
                              },
                            })
                          }
                          className="h-8"
                          min="1"
                        />
                      </div>
                    )}
                  </div>

                  {/* Stealth Options */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">
                      Stealth Configuration
                    </h4>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="split-buys"
                        checked={advancedConfig.stealth.splitBuys}
                        onCheckedChange={(checked) =>
                          setAdvancedConfig({
                            ...advancedConfig,
                            stealth: {
                              ...advancedConfig.stealth,
                              splitBuys: checked === true,
                            },
                          })
                        }
                      />
                      <Label htmlFor="split-buys">
                        Split large buys into smaller chunks
                      </Label>
                    </div>

                    {advancedConfig.stealth.splitBuys && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label
                            htmlFor="min-chunks"
                            className="text-xs mb-1 block"
                          >
                            Min Chunks:
                          </Label>
                          <Input
                            id="min-chunks"
                            type="number"
                            value={advancedConfig.stealth.randomChunks.min}
                            onChange={(e) =>
                              setAdvancedConfig({
                                ...advancedConfig,
                                stealth: {
                                  ...advancedConfig.stealth,
                                  randomChunks: {
                                    ...advancedConfig.stealth.randomChunks,
                                    min: Number(e.target.value),
                                  },
                                },
                              })
                            }
                            className="h-8"
                            min="2"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="max-chunks"
                            className="text-xs mb-1 block"
                          >
                            Max Chunks:
                          </Label>
                          <Input
                            id="max-chunks"
                            type="number"
                            value={advancedConfig.stealth.randomChunks.max}
                            onChange={(e) =>
                              setAdvancedConfig({
                                ...advancedConfig,
                                stealth: {
                                  ...advancedConfig.stealth,
                                  randomChunks: {
                                    ...advancedConfig.stealth.randomChunks,
                                    max: Number(e.target.value),
                                  },
                                },
                              })
                            }
                            className="h-8"
                            min={advancedConfig.stealth.randomChunks.min}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="distribute-after"
                        checked={advancedConfig.stealth.distributeAfterSnipe}
                        onCheckedChange={(checked) =>
                          setAdvancedConfig({
                            ...advancedConfig,
                            stealth: {
                              ...advancedConfig.stealth,
                              distributeAfterSnipe: checked === true,
                            },
                          })
                        }
                      />
                      <Label htmlFor="distribute-after">
                        Distribute tokens to more wallets after snipe
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Original/Simplified UI for preset mode
            <>
              {/* Snipe Percentage Configuration */}
              <div className="border rounded-lg p-2 sm:p-4">
                <h3 className="text-base font-medium mb-2 sm:mb-3">
                  Snipe Percentage
                </h3>
                <p className="text-sm text-muted-foreground mb-2 sm:mb-4">
                  Determine what percentage of the token supply in the pool you
                  want to snipe. This amount will be distributed across your
                  sniping wallets.
                </p>

                <div className="space-y-3 sm:space-y-4">
                  <div className="pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <Label
                        htmlFor="snipePercentage"
                        className="text-xs sm:text-sm"
                      >
                        Percentage of pool to snipe:
                      </Label>
                      <span className="font-medium">{snipePercentage}%</span>
                    </div>
                    <Slider
                      id="snipePercentage"
                      defaultValue={[50]}
                      min={1}
                      max={100}
                      step={1}
                      value={[snipePercentage]}
                      onValueChange={(values) => setSnipePercentage(values[0])}
                      className="mb-2"
                    />
                    <div className="flex justify-end mt-2">
                      <Input
                        type="number"
                        className="w-20"
                        value={snipePercentage}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 1 && value <= 100) {
                            setSnipePercentage(value);
                          }
                        }}
                        min={1}
                        max={100}
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-md p-2 sm:p-3 text-amber-800 text-xs sm:text-sm">
                    <p className="font-medium mb-1">
                      ⚠️ Snipe Percentage Warning
                    </p>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-xs">
                      <li>
                        Higher percentages can cause significant price impact
                      </li>
                      <li>Recommended range is 5-25% for most tokens</li>
                      <li>Values over 50% may cause extreme slippage</li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => {
                      // Calculate snipe amounts based on pool liquidity
                      calculatePoolSnipeAmount(
                        project?.tokenAddress || '',
                        snipePercentage,
                        doAddLiquidity,
                        doAddLiquidity ? liquidityTokenAmount : 0
                      )
                        .then((totalSnipeAmount) => {
                          // Calculate amounts with random variation for each wallet
                          const baseAmountPerWallet =
                            totalSnipeAmount / parseInt(walletCount, 10);

                          // Update wallets with new amounts
                          setWallets((prevWallets) =>
                            prevWallets.map((wallet) => {
                              if (wallet.role === 'botmain')
                                return { ...wallet, tokenAmount: 0 };

                              // Generate random variation between -15% to +15%
                              const variation = Math.random() * 0.3 - 0.15; // -0.15 to +0.15
                              const variationMultiplier = 1 + variation;
                              const adjustedAmount =
                                baseAmountPerWallet * variationMultiplier;

                              return {
                                ...wallet,
                                tokenAmount: Math.floor(adjustedAmount), // Round down to ensure integer amounts
                              };
                            })
                          );
                          // Reset BNB distribution state when token amounts are reassigned
                          setIsBnbDistributed(false);

                          toast({
                            title: 'Success',
                            description:
                              'Snipe amounts calculated based on pool liquidity',
                          });
                        })
                        .catch((error) => {
                          toast({
                            title: 'Error',
                            description:
                              error.message ||
                              'Failed to calculate snipe amounts',
                            variant: 'destructive',
                          });
                        });
                    }}
                    disabled={
                      !poolInfo ||
                      !wallets.length ||
                      wallets.filter((w) => w.role !== 'botmain').length === 0
                    }
                    className="w-full mt-2"
                  >
                    Calculate Token Amounts
                  </Button>
                </div>
              </div>

              {/* Wallet Distribution Table */}
              <div className="border rounded-lg p-2 sm:p-4">
                <h3 className="text-base font-medium mb-2 sm:mb-3">
                  Token Distribution
                </h3>
                <p className="text-sm text-muted-foreground mb-2 sm:mb-4">
                  Review how tokens will be distributed across your sniping
                  wallets. You can adjust individual amounts manually if needed.
                </p>

                {wallets.filter((w) => w.role !== 'botmain').length > 0 ? (
                  <div className="overflow-x-auto border rounded-md">
                    <div className="max-w-[800px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[8%]">No</TableHead>
                            <TableHead className="w-[20%]">Wallet</TableHead>
                            <TableHead className="text-left">
                              Token Amount
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {wallets
                            .filter((w) => w.role !== 'botmain')
                            .map((wallet, index) => {
                              return (
                                <TableRow key={wallet.publicKey}>
                                  <TableCell className="text-left">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    <span className="hidden sm:inline">
                                      {wallet.publicKey.slice(0, 4)}...
                                      {wallet.publicKey.slice(-4)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-left">
                                    <Input
                                      type="number"
                                      value={wallet.tokenAmount || 0}
                                      onChange={(e) => {
                                        setWallets((prevWallets) =>
                                          prevWallets.map((w) =>
                                            w.publicKey === wallet.publicKey
                                              ? {
                                                  ...w,
                                                  tokenAmount: Number(
                                                    e.target.value
                                                  ),
                                                }
                                              : w
                                          )
                                        );
                                        // Reset BNB distribution state when amounts change
                                        setIsBnbDistributed(false);
                                      }}
                                      className="h-7 w-20 sm:w-32 ml-auto"
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          <TableRow className="bg-muted/20 font-medium">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-left">
                              {wallets
                                .filter((w) => w.role !== 'botmain')
                                .reduce(
                                  (sum, wallet) =>
                                    sum + (wallet.tokenAmount || 0),
                                  0
                                )
                                .toLocaleString()}
                              ({snipePercentage}% of pool)
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6 bg-muted/10 rounded-md">
                    <p className="text-muted-foreground">
                      No sniping wallets available
                    </p>
                    <p className="text-xs mt-2">
                      Please go back to the Wallet Setup step to create wallets
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Help Section */}
          <div className="bg-muted/20 rounded-lg p-2 sm:p-4">
            <h3 className="text-base font-medium mb-2">Tips</h3>
            <ul className="list-disc ml-4 sm:ml-5 space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li>
                Using multiple wallets helps distribute your snipe to reduce
                price impact
              </li>
              <li>
                Token amounts are distributed with slight random variations to
                make the snipe more natural
              </li>
              <li>
                You can manually adjust individual wallet amounts if needed
              </li>
              <li>
                Consider how much of the pool you want to snipe - higher
                percentages will have larger price impacts
              </li>
            </ul>
          </div>
        </div>
        {renderNavigationFooter()}
      </CardContent>
    </Card>
  );

  const renderFeeDistributionStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-2 sm:px-6 sm:pb-4">
        <CardTitle>Fee Estimation & BNB Distribution</CardTitle>
        <CardDescription>
          Estimate required fees and distribute BNB to your sniping wallets.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Deposit Wallet Balance */}
          <div className="border rounded-lg p-2 sm:p-4 bg-muted/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium mb-2">Deposit Wallet</h3>

              <Button
                variant="outline"
                size="sm"
                className="h-8 ml-auto"
                onClick={() => {
                  const allAddresses = [
                    ...(project?.addons.SnipeBot.depositWalletId?.publicKey
                      ? [project?.addons.SnipeBot.depositWalletId.publicKey]
                      : []),
                    ...wallets
                      .filter((w) => w.role !== 'botmain')
                      .map((w) => w.publicKey),
                  ];
                  fetchBalances(allAddresses);
                }}
                disabled={isLoadingBalances}
              >
                {isLoadingBalances ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Balances
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Address:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-muted/20 px-1 py-0.5 rounded truncate max-w-[150px] sm:max-w-[200px]">
                    {project?.addons.SnipeBot.depositWalletId?.publicKey.slice(
                      0,
                      6
                    )}
                    ...
                    {project?.addons.SnipeBot.depositWalletId?.publicKey.slice(
                      -4
                    )}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() =>
                      project?.addons.SnipeBot.depositWalletId &&
                      copyToClipboard(
                        project?.addons.SnipeBot.depositWalletId.publicKey
                      )
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  BNB Balance:
                </p>
                <p className="font-medium">
                  {wallets
                    .find((w) => w.role === 'botmain')
                    ?.bnbBalance?.toFixed(4) || '0.0000'}{' '}
                  BNB
                </p>
              </div>
            </div>
          </div>

          {/* Fee Estimation and BNB Distribution in a side-by-side layout on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Fee Estimation Section */}
            <div className="border rounded-lg p-2 sm:p-4">
              <h3 className="text-base font-medium mb-2 sm:mb-3">
                Fee Estimation
              </h3>
              <p className="text-sm text-muted-foreground mb-2 sm:mb-4">
                Calculate the estimated gas fees and BNB required for the
                sniping operation.
              </p>

              <Button
                onClick={handleEstimateFees}
                disabled={
                  isEstimatingFees ||
                  wallets.filter((w) => w.role !== 'botmain').length === 0
                }
                className="w-full mb-4"
              >
                {isEstimatingFees ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Estimating...
                  </>
                ) : (
                  'Estimate Fees'
                )}
              </Button>

              {feeEstimationResult ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-muted/20 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">
                        BNB for Sniping:
                      </p>
                      <p className="font-medium">
                        {feeEstimationResult.snipingBnb.toFixed(6)} BNB
                      </p>
                    </div>
                    <div className="bg-muted/20 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">
                        Gas Cost:
                      </p>
                      <p className="font-medium">
                        {feeEstimationResult.gasCost?.toFixed(6) || '0.000000'}{' '}
                        BNB
                      </p>
                    </div>
                    <div className="bg-muted/20 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">
                        BNB should be distributed to sniping wallets:
                      </p>
                      <p className="font-medium">
                        {feeEstimationResult.bnbForDistribution.toFixed(6)} BNB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-muted/10 rounded-md">
                  <p className="text-muted-foreground">
                    Run fee estimation to see details
                  </p>
                </div>
              )}
            </div>

            {/* BNB Distribution Section */}
            <div className="border rounded-lg p-2 sm:p-4">
              <h3 className="text-base font-medium mb-2 sm:mb-3">
                BNB Distribution to sniping wallets
              </h3>
              <p className="text-sm text-muted-foreground mb-2 sm:mb-4">
                Distribute BNB from your deposit wallet to your sniping wallets.
              </p>

              <div className="space-y-4">
                <Button
                  onClick={handleDistributeBnb}
                  className={`w-full ${
                    feeEstimationResult &&
                    (wallets.find(
                      (w) =>
                        w.publicKey ===
                        project?.addons?.SnipeBot?.depositWalletId?.publicKey
                    )?.bnbBalance || 0) <
                      feeEstimationResult.bnbForDistribution +
                        wallets
                          .filter((w) => w.role !== 'botmain')
                          .reduce(
                            (sum, wallet) =>
                              sum + (wallet.insufficientBnb || 0),
                            0
                          )
                      ? 'border-2 border-red-500 hover:border-red-600'
                      : feeEstimationResult &&
                          feeEstimationResult.bnbForDistribution +
                            wallets
                              .filter((w) => w.role !== 'botmain')
                              .reduce(
                                (sum, wallet) =>
                                  sum + (wallet.insufficientBnb || 0),
                                0
                              ) >
                            0
                        ? 'border-2 border-amber-500 hover:border-amber-600'
                        : ''
                  } `}
                  disabled={
                    isEstimatingFees ||
                    !wallets.filter(
                      (wallet: WalletInfo) => wallet.role !== 'botmain'
                    ).length ||
                    isDistributingBNBs ||
                    !feeEstimationResult
                  }
                >
                  {isDistributingBNBs ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Distributing...
                    </>
                  ) : !feeEstimationResult ? (
                    'Estimate Fees First'
                  ) : (
                    'Distribute BNB'
                  )}
                </Button>
              </div>
              {feeEstimationResult &&
                feeEstimationResult.bnbForDistribution > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    You need to distribute{' '}
                    {feeEstimationResult.bnbForDistribution.toFixed(6)} BNB to
                    your sniping wallets.
                  </p>
                )}
            </div>
          </div>

          {/* Extra BNB Distribution */}
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-3">
              Distribute Extra BNB (Recommended)
            </h3>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Label htmlFor="distributeAmount" className="whitespace-nowrap">
                  Amount per wallet:
                </Label>
                <Input
                  id="distributeAmount"
                  type="number"
                  value={distributeAmount}
                  onChange={(e) => setDistributeAmount(Number(e.target.value))}
                  step="0.01"
                  min="0"
                  className="max-w-32"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">BNB</span>
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => {
                    handleDistributeExtraBnb();
                  }}
                  disabled={
                    isEstimatingFees ||
                    !wallets.filter(
                      (wallet: WalletInfo) => wallet.role !== 'botmain'
                    ).length ||
                    isDistributingBNBs
                  }
                >
                  {isDistributingBNBs
                    ? 'Distributing...'
                    : 'Distribute Extra BNB'}
                </Button>
              </div>
            </div>

            <div className="border border-green-400 rounded-md p-3 mt-4 text-green-700 text-sm">
              <p>
                💡 This is useful for providing BNB to wallets for later
                operations like selling tokens.
              </p>
            </div>
          </div>
          {/* Fee Estimation Results (only show if simulation result exists) */}
          {feeEstimationResult && (
            <div className="border rounded-lg p-2 sm:p-4">
              <h3 className="text-base font-medium mb-2 sm:mb-3">
                Sniping Fee Estimation Results
              </h3>
              <div className="text-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  <p>
                    <span className="text-muted-foreground">
                      Deposit Wallet BNB Balance:
                    </span>{' '}
                    {wallets
                      .find(
                        (w) =>
                          w.publicKey ===
                          project?.addons.SnipeBot.depositWalletId?.publicKey
                      )
                      ?.bnbBalance?.toFixed(4) || '0.0000'}{' '}
                    BNB
                  </p>
                  {feeEstimationResult.addLiquidityBnb !== undefined && (
                    <p>
                      <span className="text-muted-foreground">
                        BNB for Adding Liquidity:
                      </span>{' '}
                      {feeEstimationResult.addLiquidityBnb.toFixed(4)} BNB
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">
                      BNB will be send for Sniping:
                    </span>{' '}
                    {feeEstimationResult.snipingBnb.toFixed(6)} BNB
                  </p>
                  {feeEstimationResult.tipBnb !== undefined && (
                    <p>
                      <span className="text-muted-foreground">
                        BNB for Bundle Tip:
                      </span>{' '}
                      {feeEstimationResult.tipBnb.toFixed(4)} BNB
                    </p>
                  )}
                </div>

                {feeEstimationResult.gasCost !== undefined && (
                  <p>
                    <span className="text-muted-foreground">Gas Cost:</span>{' '}
                    {feeEstimationResult.gasCost.toFixed(6)} BNB
                  </p>
                )}
                <p>
                  <span className="text-muted-foreground">
                    Total BNB to be distributed:
                  </span>{' '}
                  {feeEstimationResult.bnbForDistribution.toFixed(6)} BNB
                </p>

                {feeEstimationResult.poolSimulation &&
                  feeEstimationResult.poolSimulation.initialReserves && (
                    <div className="mt-3 p-2 rounded border bg-background">
                      <h4 className="font-medium mb-1">Pool Simulation</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                        <p>
                          <span className="text-muted-foreground">
                            Initial BNB:
                          </span>{' '}
                          {feeEstimationResult.poolSimulation.initialReserves.bnb.toFixed(
                            4
                          )}{' '}
                          BNB
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Initial Tokens:
                          </span>{' '}
                          {feeEstimationResult.poolSimulation.initialReserves.token.toLocaleString()}{' '}
                          Tokens
                        </p>
                        {feeEstimationResult.poolSimulation.finalReserves && (
                          <>
                            <p>
                              <span className="text-muted-foreground">
                                Final BNB:
                              </span>{' '}
                              {feeEstimationResult.poolSimulation.finalReserves.bnb.toFixed(
                                4
                              )}{' '}
                              BNB
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Final Tokens:
                              </span>{' '}
                              {feeEstimationResult.poolSimulation.finalReserves.token.toLocaleString()}{' '}
                              Tokens
                            </p>
                          </>
                        )}
                        {feeEstimationResult.poolSimulation.priceImpact !==
                          undefined && (
                          <p>
                            <span className="text-muted-foreground">
                              Price Impact:
                            </span>{' '}
                            {(
                              feeEstimationResult.poolSimulation.priceImpact *
                              100
                            ).toFixed(2)}
                            %
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                <div className="mt-3 p-2 rounded border bg-background">
                  <p
                    className={
                      feeEstimationResult.sufficientBalance
                        ? Number(feeEstimationResult.bnbForDistribution) +
                            wallets
                              .filter((w) => w.role !== 'botmain')
                              .reduce(
                                (sum, wallet) =>
                                  sum + (wallet.insufficientBnb || 0),
                                0
                              ) >
                          0
                          ? 'text-amber-500 font-medium'
                          : 'text-green-500 font-medium'
                        : 'text-red-500 font-medium'
                    }
                  >
                    {feeEstimationResult.sufficientBalance
                      ? Number(feeEstimationResult.bnbForDistribution) +
                          wallets
                            .filter((w) => w.role !== 'botmain')
                            .reduce(
                              (sum, wallet) =>
                                sum + (wallet.insufficientBnb || 0),
                              0
                            ) >
                        0
                        ? '✓ Fee estimation successful. You can distribute BNB to sniping wallets and then proceed with simulation and execution.'
                        : '✓✓ Perfect. All sniping wallets have sufficient BNB balance. Please go to next step.'
                      : `⚠ Insufficient balance. You need to fill BNB to deposit wallet and then distribute BNB to sniping wallets before proceeding with simulation and execution.`}
                  </p>
                </div>

                {!feeEstimationResult.sufficientBalance &&
                  insufficientFundsDetails && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                      <p className="font-medium mb-1">
                        Insufficient BNB Details:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs">
                        <li>
                          <span className="font-medium">
                            {insufficientFundsDetails.walletType}:
                          </span>{' '}
                          {insufficientFundsDetails.walletAddress.slice(0, 6)}
                          ...{insufficientFundsDetails.walletAddress.slice(-4)}
                        </li>
                        <li>
                          Available:{' '}
                          {insufficientFundsDetails.availableBnb.toFixed(6)} BNB
                        </li>
                        <li>
                          Required:{' '}
                          {insufficientFundsDetails.requiredBnb.toFixed(6)} BNB
                        </li>
                        <li>
                          Missing:{' '}
                          <span className="font-medium">
                            {insufficientFundsDetails.missingBnb.toFixed(6)} BNB
                          </span>
                        </li>
                      </ul>
                      <p className="text-xs mt-2">
                        Please distribute more BNB to this wallet before
                        execution.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}
          {/* Help Section */}
          <div className="bg-muted/20 rounded-lg p-2 sm:p-4">
            <h3 className="text-base font-medium mb-2">Tips</h3>
            <ul className="list-disc ml-4 sm:ml-5 space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li>
                Always estimate fees before distributing BNB to ensure you have
                enough funds
              </li>
              <li>
                Make sure your deposit wallet has sufficient BNB to cover all
                costs
              </li>
              <li>
                Consider distributing extra BNB if you plan to sell tokens later
              </li>
              <li>
                The system automatically calculates the optimal BNB needed for
                each wallet
              </li>
            </ul>
          </div>
        </div>
        {renderNavigationFooter()}
      </CardContent>
    </Card>
  );

  const renderSimulationStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-2 sm:px-6 sm:pb-4">
        <CardTitle>Simulation</CardTitle>
        <CardDescription>
          Run a simulation to ensure everything is correctly set up before
          executing.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Readiness Check */}
          <div className="border rounded-lg p-2 sm:p-4">
            <h3 className="text-base font-medium mb-2 sm:mb-3">
              Pre-Simulation Checklist
            </h3>

            <div className="space-y-2">
              {/* Wallet Setup Check */}
              <div className="flex items-center gap-3">
                {wallets.filter((w) => w.role !== 'botmain').length > 0 ? (
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-green-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-red-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <span className="text-sm">Sniping wallets configured</span>
              </div>

              {/* Token Amount Check */}
              <div className="flex items-center gap-3">
                {wallets
                  .filter((w) => w.role !== 'botmain')
                  .some((w) => (w.tokenAmount || 0) > 0) ? (
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-green-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-red-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <span className="text-sm">Token snipe amounts configured</span>
              </div>

              {/* Fee Estimation Check */}
              <div className="flex items-center gap-3">
                {feeEstimationResult ? (
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-green-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-red-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <span className="text-sm">Fees estimated</span>
              </div>

              {/* Sufficient Balance Check */}
              <div className="flex items-center gap-3">
                {feeEstimationResult &&
                feeEstimationResult.sufficientBalance &&
                Number(feeEstimationResult.bnbForDistribution) +
                  wallets
                    .filter((w) => w.role !== 'botmain')
                    .reduce(
                      (sum, wallet) => sum + (wallet.insufficientBnb || 0),
                      0
                    ) <=
                  0 ? (
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-green-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-red-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <span className="text-sm">Sufficient balance</span>
              </div>
            </div>
          </div>

          {/* Simulation Button and Status */}
          <div className="border rounded-lg p-2 sm:p-4">
            <h3 className="text-base font-medium mb-2 sm:mb-3">
              Simulate Snipe Operation
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Run a simulation to verify that your snipe operation is configured
              correctly and can be executed successfully.
            </p>

            <div className="space-y-4">
              <Button
                onClick={() => {
                  handleSimulate();
                }}
                disabled={
                  isEstimatingFees ||
                  isSimulating ||
                  !feeEstimationResult ||
                  isExecuting ||
                  !wallets
                    .filter((w) => w.role !== 'botmain')
                    .some((w) => (w.tokenAmount || 0) > 0) ||
                  !wallets
                    .filter((w) => w.role !== 'botmain')
                    .every((w) => (w.bnbNeeded || 0) === 0)
                }
                className="w-full"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  'Simulate Bundle'
                )}
              </Button>

              {/* Simulation Status */}
              <div className="bg-muted/20 p-3 rounded-md">
                <h4 className="text-sm font-medium mb-2">Simulation Status</h4>
                {isSimulating ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Simulation in progress...</span>
                  </div>
                ) : simulationResult ? (
                  <div className="text-sm">
                    <p
                      className={
                        simulationResult.success
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {simulationResult.success
                        ? '✓ Simulation successful! You can proceed to execution.'
                        : '⚠ Simulation completed, but some wallets have insufficient funds.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No simulation has been run yet. Click "Simulate Bundle" to
                    start.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4">
            <h3 className="text-base font-medium mb-1">Next Steps</h3>
            <p className="text-sm text-blue-700">
              After successful simulation, proceed to the execution step to
              snipe the token.
            </p>
          </div>
        </div>
        {renderNavigationFooter()}
      </CardContent>
    </Card>
  );

  const renderExecutionStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-2 sm:px-6 sm:pb-4">
        <CardTitle>Execution</CardTitle>
        <CardDescription>
          Execute the snipe operation with the configured parameters.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Grid layout for wider screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Final Confirmation */}
            <div className="border rounded-lg p-2 sm:p-4">
              <h3 className="text-base font-medium mb-2 sm:mb-3">
                Final Confirmation
              </h3>
              <p className="text-sm text-muted-foreground mb-2 sm:mb-4">
                Please verify all details below before executing the snipe
                operation.
              </p>

              <div className="space-y-3">
                {/* Token Information */}
                <div className="bg-muted/20 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Token:</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {project?.symbol || 'Unknown'}
                    </p>
                    <code className="text-xs font-mono bg-muted/30 px-1 py-0.5 rounded">
                      {project?.tokenAddress.slice(0, 6)}...
                      {project?.tokenAddress.slice(-4)}
                    </code>
                  </div>
                </div>

                {/* Operation Summary */}
                <div className="bg-muted/20 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">
                    Operation Summary:
                  </p>
                  <ul className="mt-1 space-y-1 text-sm">
                    <li>
                      <span className="text-muted-foreground">
                        Sniping Wallets:
                      </span>{' '}
                      {wallets.filter((w) => w.role !== 'botmain').length}
                    </li>
                    <li>
                      <span className="text-muted-foreground">
                        Total Tokens to Buy:
                      </span>{' '}
                      {wallets
                        .filter((w) => w.role !== 'botmain')
                        .reduce(
                          (sum, wallet) => sum + (wallet.tokenAmount || 0),
                          0
                        )
                        .toLocaleString()}
                    </li>
                    <li>
                      <span className="text-muted-foreground">
                        Total BNB Required:
                      </span>{' '}
                      {feeEstimationResult
                        ? feeEstimationResult.totalBnbNeeded.toFixed(6)
                        : '0.000000'}{' '}
                      BNB
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Execution Controls */}
            <div className="border rounded-lg p-2 sm:p-4">
              <h3 className="text-base font-medium mb-2 sm:mb-3">
                Execute Bundle
              </h3>
              <p className="text-sm text-muted-foreground mb-2 sm:mb-4">
                Click the button below to execute the bundle operation with all
                configured parameters.
              </p>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2 sm:p-3 text-amber-800 text-xs sm:text-sm mb-4">
                <p className="font-medium mb-1">⚠️ Important</p>
                <p>
                  Once executed, this operation cannot be reversed. Ensure all
                  parameters are correct.
                </p>
              </div>

              <Button
                onClick={handleExecute}
                disabled={
                  isExecuting ||
                  insufficientFundsDetails !== null ||
                  !feeEstimationResult ||
                  !feeEstimationResult.sufficientBalance ||
                  !wallets
                    .filter((w) => w.role !== 'botmain')
                    .some((w) => (w.tokenAmount || 0) > 0) ||
                  !wallets
                    .filter((w) => w.role !== 'botmain')
                    .every((w) => (w.bnbNeeded || 0) === 0)
                }
                className="w-full mb-4"
                variant={
                  insufficientFundsDetails ||
                  !feeEstimationResult?.sufficientBalance
                    ? 'outline'
                    : 'default'
                }
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  'Execute Bundle'
                )}
              </Button>

              {insufficientFundsDetails && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-700 text-sm">
                  <p className="font-medium mb-1">
                    ⚠️ Cannot Execute: Insufficient Funds
                  </p>
                  <p>
                    Please go back to the previous step and resolve the
                    insufficient funds issue.
                  </p>
                </div>
              )}

              {!insufficientFundsDetails &&
                feeEstimationResult &&
                !feeEstimationResult.sufficientBalance && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-700 text-sm">
                    <p className="font-medium mb-1">
                      ⚠️ Cannot Execute: Insufficient Balance
                    </p>
                    <p>
                      Your deposit wallet doesn't have enough BNB to cover the
                      operation costs.
                    </p>
                  </div>
                )}

              {!insufficientFundsDetails &&
                (!feeEstimationResult ||
                  !wallets
                    .filter((w) => w.role !== 'botmain')
                    .every((w) => (w.bnbNeeded || 0) === 0)) && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-sm">
                    <p className="font-medium mb-1">
                      ⚠️ Cannot Execute: Incomplete Setup
                    </p>
                    <p>
                      Please complete fee estimation and BNB distribution before
                      executing.
                    </p>
                  </div>
                )}

              {/* Execution Status */}
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Execution Status</h4>

                {isExecuting ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="font-medium">Executing Bundle Operation</p>
                    <p className="text-sm text-muted-foreground">
                      This may take a few moments...
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-muted/10 rounded-md">
                    {executionSuccess ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-4" />
                        <p className="font-medium text-green-600">
                          Execution Successful!
                        </p>
                        <p className="text-xs mt-2 text-muted-foreground">
                          You can now proceed to manage your tokens
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground">
                          No execution in progress
                        </p>
                        <p className="text-xs mt-2">
                          Click "Execute Bundle" to start the operation
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4">
            <h3 className="text-base font-medium mb-2">Next Steps</h3>
            <p className="text-sm text-blue-700 mb-2">
              After successful execution, you can:
            </p>
            <ul className="list-disc ml-4 sm:ml-5 space-y-1 text-sm text-blue-700">
              <li>
                Proceed to the next step to manage your tokens (selling,
                collecting BNB)
              </li>
              <li>Check wallet balances to verify tokens were received</li>
              <li>Monitor the token price on PancakeSwap</li>
            </ul>
          </div>

          {/* Help Section */}
          <div className="bg-muted/20 rounded-lg p-2 sm:p-4">
            <h3 className="text-base font-medium mb-2">Tips</h3>
            <ul className="list-disc ml-4 sm:ml-5 space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li>Ensure all parameters are correct before executing</li>
              <li>
                The execution process automatically handles all the steps
                required for sniping
              </li>
              <li>
                After execution, wait for a few moments for all transactions to
                complete
              </li>
              <li>
                If execution fails, check wallet balances and try simulating
                again
              </li>
            </ul>
          </div>
        </div>
        {renderNavigationFooter()}
      </CardContent>
    </Card>
  );

  const renderPostOperationStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-2 sm:px-6 sm:pb-4">
        <CardTitle>Post-Operation Management</CardTitle>
        <CardDescription>
          Sell tokens and collect BNB after successful sniping.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Wallet Management Section */}
          <div className="border rounded-lg p-2 sm:p-4 w-full">
            <h3 className="text-base font-medium mb-2 sm:mb-3">
              Wallet Management
            </h3>
            <p className="text-sm text-muted-foreground mb-2 sm:mb-4">
              Manage your wallets, sell tokens, and collect BNB.
            </p>
            {/* Deposit Wallet Balance */}
            <div className="border rounded-lg p-2 sm:p-4 bg-muted/10 mb-2">
              <h3 className="text-base font-medium mb-2">Deposit Wallet</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Address:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted/20 px-1 py-0.5 rounded truncate max-w-[150px] sm:max-w-[200px]">
                      {project?.addons.SnipeBot.depositWalletId?.publicKey.slice(
                        0,
                        6
                      )}
                      ...
                      {project?.addons.SnipeBot.depositWalletId?.publicKey.slice(
                        -4
                      )}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() =>
                        project?.addons.SnipeBot.depositWalletId &&
                        copyToClipboard(
                          project?.addons.SnipeBot.depositWalletId.publicKey
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    BNB Balance:
                  </p>
                  <p className="font-medium">
                    {wallets
                      .find((w) => w.role === 'botmain')
                      ?.bnbBalance?.toFixed(4) || '0.0000'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {project?.symbol || project?.name} Balance:
                  </p>
                  <p className="font-medium">
                    {wallets
                      .find((w) => w.role === 'botmain')
                      ?.tokenBalance?.toFixed(4) || '0.0000'}
                  </p>
                </div>
              </div>
            </div>

            {/* Wallet Table */}
            <div className="relative h-[115px]">
              <div className="border rounded-lg w-full absolute">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">BNB</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-center">Sell %</TableHead>
                      <TableHead className="text-center">
                        BNB Rate for buying %
                      </TableHead>
                      <TableHead className="text-center">Multi</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets.length > 0 ? (
                      wallets
                        .filter((w) => w.role !== 'botmain')
                        .map((wallet, _index) => (
                          <TableRow key={wallet.publicKey}>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="text-xs font-mono">
                                  {wallet.publicKey.slice(0, 6)}...
                                  {wallet.publicKey.slice(-4)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 ml-1"
                                  onClick={() =>
                                    copyToClipboard(wallet.publicKey)
                                  }
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    window.open(
                                      `https://bscscan.com/address/${wallet.publicKey}`,
                                      '_blank'
                                    )
                                  }
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {wallet.bnbBalance?.toFixed(4) || '0.000000'}
                            </TableCell>
                            <TableCell className="text-right">
                              {wallet.tokenBalance?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 w-16 text-center"
                                min={1}
                                max={100}
                                value={
                                  wallet.sellPercentage === undefined
                                    ? 100
                                    : wallet.sellPercentage
                                }
                                onChange={(e) =>
                                  setWallets((prev) =>
                                    prev.map((w) =>
                                      w.publicKey === wallet.publicKey
                                        ? {
                                            ...w,
                                            sellPercentage: Number(
                                              e.target.value
                                            ),
                                          }
                                        : w
                                    )
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 w-16 text-center"
                                min={1}
                                max={100}
                                value={
                                  wallet.bnbSpendRate === undefined
                                    ? 50
                                    : wallet.bnbSpendRate
                                }
                                onChange={(e) =>
                                  setWallets((prev) =>
                                    prev.map((w) =>
                                      w.publicKey === wallet.publicKey
                                        ? {
                                            ...w,
                                            bnbSpendRate: Number(
                                              e.target.value
                                            ),
                                          }
                                        : w
                                    )
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={
                                  (wallet.tokenBalance || 0) <= 0 &&
                                  (wallet.bnbBalance || 0) <= 0
                                    ? false
                                    : wallet.isSelectedForMutilSell || false
                                }
                                onCheckedChange={(checked) =>
                                  setWallets((prev) =>
                                    prev.map((w) =>
                                      w.publicKey === wallet.publicKey
                                        ? {
                                            ...w,
                                            isSelectedForMutilSell:
                                              checked === true,
                                          }
                                        : w
                                    )
                                  )
                                }
                                disabled={
                                  (wallet.tokenBalance || 0) <= 0 &&
                                  (wallet.bnbBalance || 0) <= 0
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-row gap-2 justify-center">
                                <Button
                                  className="h-8"
                                  variant="outline"
                                  onClick={() =>
                                    handleSingleBuy(wallet.publicKey)
                                  }
                                  disabled={
                                    executingSingleBuys[wallet.publicKey] ||
                                    wallet.isSelectedForMutilSell
                                  }
                                >
                                  {executingSingleBuys[wallet.publicKey] ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Buy
                                </Button>
                                <Button
                                  className="h-8"
                                  onClick={() =>
                                    handleSingleSell(
                                      wallet.publicKey,
                                      wallet.sellPercentage || 100
                                    )
                                  }
                                  disabled={
                                    executingSingleSells[wallet.publicKey] ||
                                    wallet.isSelectedForMutilSell ||
                                    (wallet.tokenBalance || 0) <= 0
                                  }
                                >
                                  {executingSingleSells[wallet.publicKey] ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Sell
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          <span className="text-sm text-muted-foreground">
                            No wallets found. Generate wallets to start.
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  const addresses = wallets.map((w) => w.publicKey);
                  fetchBalances(addresses);
                }}
                className="h-9"
                variant="outline"
                disabled={isLoadingBalances}
              >
                {isLoadingBalances ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Refresh Balances
              </Button>

              <Button
                onClick={handleCollectBnb}
                className="h-9"
                variant="outline"
                disabled={
                  isCollectingBnb ||
                  isExecutingMultiSell ||
                  !wallets.some(
                    (w) => w.role !== 'botmain' && (w.bnbBalance || 0) > 0.00002
                  )
                }
              >
                {isCollectingBnb ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Collect BNB
              </Button>

              <Button
                onClick={handleDownloadWalletInfo}
                className="h-9"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Table
              </Button>

              <Button
                onClick={handleMultiSell}
                disabled={
                  isExecutingMultiSell ||
                  isCollectingBnb ||
                  !wallets.some(
                    (w) =>
                      w.isSelectedForMutilSell &&
                      w.role !== 'botmain' &&
                      (w.tokenBalance || 0) > 0
                  )
                }
                className="h-9"
              >
                {isExecutingMultiSell ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Multi Sell {project?.symbol || project?.name}
              </Button>

              <Button
                onClick={handleMultiBuy}
                disabled={
                  isExecutingMultiBuy ||
                  isCollectingBnb ||
                  !wallets.some(
                    (w) =>
                      w.isSelectedForMutilSell &&
                      w.role !== 'botmain' &&
                      (w.bnbBalance || 0) > 0
                  )
                }
                className="h-9"
                variant="secondary"
              >
                {isExecutingMultiBuy ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Multi Buy {project?.symbol || project?.name}
              </Button>

              <Button
                onClick={() => {
                  handleDistributeBnb();
                }}
                variant="outline"
                className={`h-9 ${
                  insufficientFundsDetails &&
                  (insufficientFundsDetails?.missingBnb || 0) > 0
                    ? 'border-2 border-red-500 hover:border-red-600'
                    : ''
                } `}
                disabled={
                  !wallets.filter(
                    (wallet: WalletInfo) => wallet.role !== 'botmain'
                  ).length ||
                  isDistributingBNBs ||
                  (insufficientFundsDetails?.missingBnb || 0) <= 0
                }
              >
                {isDistributingBNBs ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Distributing...
                  </>
                ) : (
                  'Distribute BNB'
                )}
              </Button>
            </div>
          </div>

          {/* Help and Instructions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <h3 className="text-sm font-medium mb-2">
                Post-Operation Instructions
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>
                  Refresh balances to see the current token and BNB amounts
                </li>
                <li>Use "Buy" to purchase tokens from individual wallets</li>
                <li>Set the sell percentage for each wallet (default: 100%)</li>
                <li>Use "Single Sell" to sell from individual wallets</li>
                <li>
                  Check wallets and use "Multi Sell" to sell from multiple
                  wallets at once
                </li>
                <li>
                  After selling, use "Collect BNB" to transfer BNB to your
                  deposit wallet
                </li>
                <li>
                  If there's insufficient BNB in any wallet, use "Distribute
                  BNB" to transfer BNB from the deposit wallet to the sniping
                  wallets
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-3">
              <h3 className="text-sm font-medium mb-2">Wallet Information</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">
                    Total Sniping Wallets:
                  </span>{' '}
                  {wallets.filter((w) => w.role !== 'botmain').length}
                </p>
                <p>
                  <span className="text-muted-foreground">
                    Total BNB Balance:
                  </span>{' '}
                  {wallets
                    .reduce((sum, w) => sum + (w.bnbBalance || 0), 0)
                    .toFixed(6)}{' '}
                  BNB
                </p>
                <p>
                  <span className="text-muted-foreground">
                    Total Token Balance:
                  </span>{' '}
                  {wallets
                    .reduce((sum, w) => sum + (w.tokenBalance || 0), 0)
                    .toLocaleString()}{' '}
                  Tokens
                </p>
                <p className="mt-4 text-xs text-blue-600">
                  <Info className="h-3 w-3 inline mr-1" />
                  Deposit wallet funds are used for gas fees during collecting
                  and selling operations.
                </p>
              </div>
            </div>
          </div>
        </div>
        {renderNavigationFooter(false, false, 'Finish', true)}
      </CardContent>
    </Card>
  );

  // Preset configuration step
  const renderPresetConfigurationStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Preset Snipe Configuration</CardTitle>
        <CardDescription>
          Configure your snipe operation using a preset strategy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Strategy Selection */}
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-3">Preset Strategy</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant={
                  presetConfig.strategy === PresetStrategy.RAPID_SNIPE
                    ? 'default'
                    : 'outline'
                }
                className="h-auto py-4 flex flex-col items-center justify-start"
                onClick={() => {
                  setPresetConfig({
                    ...presetConfig,
                    strategy: PresetStrategy.RAPID_SNIPE,
                    // Rapid snipe defaults
                    targetShare: 70,
                    targetTokenAmount: 1000000, // Default token amount (1 million)
                    numberOfWallets: 40,
                    timeFrame: 'only at TGE block',
                    maxPriceImpact: 50,
                    maxSlippage: 3,
                  });
                  // Reset to percentage mode
                  setTargetAmountType('percentage');
                }}
              >
                <span className="text-lg font-medium mb-1">Rapid Snipe</span>
              </Button>

              <Button
                variant={
                  presetConfig.strategy === PresetStrategy.STAGGERED_SNIPE
                    ? 'default'
                    : 'outline'
                }
                className="h-auto py-4 flex flex-col items-center justify-start"
                onClick={() => {
                  setPresetConfig({
                    ...presetConfig,
                    strategy: PresetStrategy.STAGGERED_SNIPE,
                    // Staggered snipe defaults
                    totalShare: 70,
                    targetTokenAmount: 1000000, // Default token amount (1 million)
                    buyStageCounts: 3,
                    minWallets: 5,
                    maxWallets: 20,
                    buyStageDuration: 'medium',
                    timeFrame: 'within first 30 minutes of launch',
                    maxSlippage: 3,
                  });
                  // Reset to percentage mode
                  setTotalAmountType('percentage');
                }}
              >
                <span className="text-lg font-medium mb-1">
                  Staggered Snipe
                </span>
              </Button>

              <Button
                variant={
                  presetConfig.strategy === PresetStrategy.PASSIVE_EARLY_BUY
                    ? 'default'
                    : 'outline'
                }
                className="h-auto py-4 flex flex-col items-center justify-start"
                onClick={() => {
                  setPresetConfig({
                    ...presetConfig,
                    strategy: PresetStrategy.PASSIVE_EARLY_BUY,
                    // Passive early buy defaults
                    targetShare: 20,
                    targetTokenAmount: 500000, // Default token amount (500K)
                    numberOfWallets: 3,
                    timeFrame: 'ASAP',
                    priceThreshold: 0.00001,
                    maxSlippage: 3,
                  });
                  // Reset price threshold unit to BNB by default
                  setPriceThresholdUnit('BNB' as const);
                  // Reset to percentage mode
                  setTargetAmountType('percentage');
                }}
              >
                <span className="text-lg font-medium mb-1">
                  Passive Early Buy
                </span>
              </Button>
            </div>
            <div className="mt-5 text-md text-muted-foreground">
              {presetConfig.strategy === PresetStrategy.RAPID_SNIPE && (
                <span className=" text-center">
                  Quickly buy a large portion of supply at launch
                </span>
              )}
              {presetConfig.strategy === PresetStrategy.STAGGERED_SNIPE && (
                <span className=" text-center">
                  Snipes in multiple bursts over the first hour/day, avoiding a
                  single big wave of buys.
                </span>
              )}
              {presetConfig.strategy === PresetStrategy.PASSIVE_EARLY_BUY && (
                <span className=" text-center">
                  Buy only if price remains under threshold
                </span>
              )}
            </div>
          </div>

          {/* Basic Options */}
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-3">Basic Options</h3>

            <div className="space-y-4">
              {/* RAPID_SNIPE Strategy Options */}
              {presetConfig.strategy === PresetStrategy.RAPID_SNIPE && (
                <>
                  {/* Target Share with unit toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="targetShare">Target Amount:</Label>
                      <div className="flex items-center gap-2">
                        {targetAmountType === 'percentage' ? (
                          <>
                            <div className="text-sm font-medium">
                              {presetConfig.targetShare}%
                            </div>
                            <div className="w-24">
                              <Input
                                id="targetShare"
                                type="number"
                                value={presetConfig.targetShare}
                                onChange={(e) =>
                                  setPresetConfig({
                                    ...presetConfig,
                                    targetShare: Number(e.target.value),
                                  })
                                }
                                className="h-8"
                                min="1"
                                max="100"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="w-36">
                            <Input
                              id="targetTokenAmount"
                              type="number"
                              value={presetConfig.targetTokenAmount || 0}
                              onChange={(e) =>
                                setPresetConfig({
                                  ...presetConfig,
                                  targetTokenAmount: Number(e.target.value),
                                })
                              }
                              className="h-8"
                              min="1"
                              placeholder="Token amount"
                            />
                          </div>
                        )}
                        <Select
                          value={targetAmountType}
                          onValueChange={(value) => setTargetAmountType(value)}
                        >
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">
                              Percentage
                            </SelectItem>
                            <SelectItem value="amount">Token Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {targetAmountType === 'percentage' && (
                      <Slider
                        defaultValue={[30]}
                        min={1}
                        max={100}
                        step={1}
                        value={[presetConfig.targetShare || 30]}
                        onValueChange={(values) =>
                          setPresetConfig({
                            ...presetConfig,
                            targetShare: values[0],
                          })
                        }
                      />
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {targetAmountType === 'percentage'
                        ? `Aim for up to ${presetConfig.targetShare}% of tokens in the pool at launch`
                        : `Aim to buy ${presetConfig.targetTokenAmount?.toLocaleString() || 0} tokens at launch`}
                    </div>
                  </div>

                  {/* Number of Wallets */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="numberOfWallets">
                        Number of Wallets:
                      </Label>
                      <div className="w-24">
                        <Input
                          id="numberOfWallets"
                          type="number"
                          value={presetConfig.numberOfWallets}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              numberOfWallets: Number(e.target.value),
                            })
                          }
                          className="h-8"
                          min="1"
                          max="50"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Distribute rapid snipe across{' '}
                      {presetConfig.numberOfWallets} wallets for higher chance
                      of success
                    </div>
                  </div>

                  {/* Time Frame - For Rapid, always TGE block */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Time Frame:</Label>
                      <div className="font-medium text-sm">
                        Only at TGE block
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Rapid snipe executes at token generation event block for
                      maximum efficiency
                    </div>
                  </div>
                </>
              )}

              {/* STAGGERED_SNIPE Strategy Options */}
              {presetConfig.strategy === PresetStrategy.STAGGERED_SNIPE && (
                <>
                  {/* Total Share with unit toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="totalShare">Total Amount:</Label>
                      <div className="flex items-center gap-2">
                        {totalAmountType === 'percentage' ? (
                          <>
                            <div className="text-sm font-medium">
                              {presetConfig.totalShare}%
                            </div>
                            <div className="w-24">
                              <Input
                                id="totalShare"
                                type="number"
                                value={presetConfig.totalShare}
                                onChange={(e) =>
                                  setPresetConfig({
                                    ...presetConfig,
                                    totalShare: Number(e.target.value),
                                  })
                                }
                                className="h-8"
                                min="1"
                                max="100"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="w-36">
                            <Input
                              id="totalTokenAmount"
                              type="number"
                              value={presetConfig.targetTokenAmount || 0}
                              onChange={(e) =>
                                setPresetConfig({
                                  ...presetConfig,
                                  targetTokenAmount: Number(e.target.value),
                                })
                              }
                              className="h-8"
                              min="1"
                              placeholder="Token amount"
                            />
                          </div>
                        )}
                        <Select
                          value={totalAmountType}
                          onValueChange={(value) => setTotalAmountType(value)}
                        >
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">
                              Percentage
                            </SelectItem>
                            <SelectItem value="amount">Token Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {totalAmountType === 'percentage' && (
                      <Slider
                        defaultValue={[70]}
                        min={1}
                        max={100}
                        step={1}
                        value={[presetConfig.totalShare || 70]}
                        onValueChange={(values) =>
                          setPresetConfig({
                            ...presetConfig,
                            totalShare: values[0],
                          })
                        }
                      />
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {totalAmountType === 'percentage'
                        ? `Total target share of ${presetConfig.totalShare}% to accumulate across all buy stages`
                        : `Total token amount of ${presetConfig.targetTokenAmount?.toLocaleString() || 0} to accumulate across all buy stages`}
                    </div>
                  </div>

                  {/* Buy Stage Counts */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="buyStageCounts">
                        Number of Buy Stages:
                      </Label>
                      <div className="w-24">
                        <Input
                          id="buyStageCounts"
                          type="number"
                          value={presetConfig.buyStageCounts}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              buyStageCounts: Number(e.target.value),
                            })
                          }
                          className="h-8"
                          min="2"
                          max="10"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Split your buys into {presetConfig.buyStageCounts} stages
                      to avoid large price impact
                    </div>
                  </div>

                  {/* Wallet Range */}
                  <div>
                    <Label htmlFor="walletRange" className="mb-2 block">
                      Wallets Per Stage:
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="minWallets" className="text-xs">
                          Min:
                        </Label>
                        <Input
                          id="minWallets"
                          type="number"
                          value={presetConfig.minWallets}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              minWallets: Number(e.target.value),
                            })
                          }
                          className="h-8"
                          min="1"
                          max={presetConfig.maxWallets || 20}
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxWallets" className="text-xs">
                          Max:
                        </Label>
                        <Input
                          id="maxWallets"
                          type="number"
                          value={presetConfig.maxWallets}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              maxWallets: Number(e.target.value),
                            })
                          }
                          className="h-8"
                          min={presetConfig.minWallets || 1}
                          max="50"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Random number of wallets used in each buy stage
                    </div>
                  </div>

                  {/* Time Between Buys */}
                  <div>
                    <Label htmlFor="buyStageDuration" className="mb-2 block">
                      Time Between Buys:
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Button
                        variant={
                          presetConfig.buyStageDuration === 'very short'
                            ? 'default'
                            : 'outline'
                        }
                        className="h-auto py-2"
                        onClick={() =>
                          setPresetConfig({
                            ...presetConfig,
                            buyStageDuration: 'very short',
                          })
                        }
                      >
                        Very Short (30s)
                      </Button>
                      <Button
                        variant={
                          presetConfig.buyStageDuration === 'medium'
                            ? 'default'
                            : 'outline'
                        }
                        className="h-auto py-2"
                        onClick={() =>
                          setPresetConfig({
                            ...presetConfig,
                            buyStageDuration: 'medium',
                          })
                        }
                      >
                        Medium (2-5 min)
                      </Button>
                      <Button
                        variant={
                          presetConfig.buyStageDuration === 'long'
                            ? 'default'
                            : 'outline'
                        }
                        className="h-auto py-2"
                        onClick={() =>
                          setPresetConfig({
                            ...presetConfig,
                            buyStageDuration: 'long',
                          })
                        }
                      >
                        Long (15+ min)
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Time interval between staggered buy transactions
                    </div>
                  </div>

                  {/* Maximum Slippage Tolerance */}
                  <div>
                    <Label htmlFor="maxSlippage" className="mb-2 block">
                      Maximum Slippage Tolerance:
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="maxSlippage"
                        type="number"
                        value={presetConfig.maxSlippage || 3}
                        onChange={(e) =>
                          setPresetConfig({
                            ...presetConfig,
                            maxSlippage: Number(e.target.value),
                          })
                        }
                        className="w-24 h-8"
                        min="0.1"
                        max="100"
                        step="0.1"
                      />
                      <span>%</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Maximum slippage tolerance for each buy transaction
                    </div>
                  </div>
                </>
              )}

              {/* PASSIVE_EARLY_BUY Strategy Options */}
              {presetConfig.strategy === PresetStrategy.PASSIVE_EARLY_BUY && (
                <>
                  {/* Price Threshold with Unit Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="priceThreshold">Price Threshold:</Label>
                      <div className="flex items-center w-36 gap-2">
                        <Input
                          id="priceThreshold"
                          type="number"
                          value={presetConfig.priceThreshold}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              priceThreshold: Number(e.target.value),
                            })
                          }
                          className="h-8"
                          min="0.000001"
                          max={priceThresholdUnit === 'BNB' ? '0.1' : '1000'}
                          step="0.000001"
                        />
                        <Select
                          value={priceThresholdUnit}
                          onValueChange={(value) =>
                            setPriceThresholdUnit(value)
                          }
                        >
                          <SelectTrigger className="h-8 w-16">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BNB">BNB</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Only buy if token price remains under this threshold (in{' '}
                      {priceThresholdUnit})
                    </div>
                  </div>

                  {/* Target Share - Representing total buying amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="targetShare">Target Amount:</Label>
                      <div className="flex items-center gap-2">
                        {targetAmountType === 'percentage' ? (
                          <>
                            <div className="text-sm font-medium">
                              {presetConfig.targetShare}%
                            </div>
                            <div className="w-24">
                              <Input
                                id="targetShare"
                                type="number"
                                value={presetConfig.targetShare}
                                onChange={(e) =>
                                  setPresetConfig({
                                    ...presetConfig,
                                    targetShare: Number(e.target.value),
                                  })
                                }
                                className="h-8"
                                min="1"
                                max="100"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="w-36">
                            <Input
                              id="targetTokenAmount"
                              type="number"
                              value={presetConfig.targetTokenAmount || 0}
                              onChange={(e) =>
                                setPresetConfig({
                                  ...presetConfig,
                                  targetTokenAmount: Number(e.target.value),
                                })
                              }
                              className="h-8"
                              min="1"
                              placeholder="Token amount"
                            />
                          </div>
                        )}
                        <Select
                          value={targetAmountType}
                          onValueChange={(value) => setTargetAmountType(value)}
                        >
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">
                              Percentage
                            </SelectItem>
                            <SelectItem value="amount">Token Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {targetAmountType === 'percentage' && (
                      <Slider
                        defaultValue={[20]}
                        min={1}
                        max={100}
                        step={1}
                        value={[presetConfig.targetShare || 20]}
                        onValueChange={(values) =>
                          setPresetConfig({
                            ...presetConfig,
                            targetShare: values[0],
                          })
                        }
                      />
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {targetAmountType === 'percentage'
                        ? `Total buying amount across all wallets (${presetConfig.targetShare}% of tokens in the pool)`
                        : `Total buying amount across all wallets (${presetConfig.targetTokenAmount?.toLocaleString() || 0} tokens)`}
                    </div>
                  </div>

                  {/* Number of Wallets - Default to 3 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="numberOfWallets">
                        Number of Wallets:
                      </Label>
                      <div className="w-24">
                        <Input
                          id="numberOfWallets"
                          type="number"
                          value={presetConfig.numberOfWallets || 3}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              numberOfWallets: Number(e.target.value) || 3,
                            })
                          }
                          className="h-8"
                          min="1"
                          max="50"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Distribute buys among {presetConfig.numberOfWallets || 3}{' '}
                      wallets
                    </div>
                  </div>

                  {/* Time Frame - Default to ASAP */}
                  {/* <div>
                    <Label htmlFor="timeFrame" className="mb-2 block">
                      Time Frame:
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Button
                        variant={
                          presetConfig.timeFrame === 'ASAP'
                            ? 'default'
                            : 'outline'
                        }
                        className="h-auto py-2"
                        onClick={() =>
                          setPresetConfig({
                            ...presetConfig,
                            timeFrame: 'ASAP',
                          })
                        }
                      >
                        ASAP
                      </Button>
                      <Button
                        variant={
                          presetConfig.timeFrame === 'only at TGE block'
                            ? 'default'
                            : 'outline'
                        }
                        className="h-auto py-2"
                        onClick={() =>
                          setPresetConfig({
                            ...presetConfig,
                            timeFrame: 'only at TGE block',
                          })
                        }
                      >
                        Only at TGE block
                      </Button>
                      <Button
                        variant={
                          presetConfig.timeFrame ===
                          'within first 30 minutes of launch'
                            ? 'default'
                            : 'outline'
                        }
                        className="h-auto py-2"
                        onClick={() =>
                          setPresetConfig({
                            ...presetConfig,
                            timeFrame: 'within first 30 minutes of launch',
                          })
                        }
                      >
                        Within first 30 minutes
                      </Button>
                    </div>
                  </div> */}

                  {/* Maximum Slippage Tolerance */}
                  <div>
                    <Label htmlFor="maxSlippage" className="mb-2 block">
                      Maximum Slippage Tolerance:
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="maxSlippage"
                        type="number"
                        value={presetConfig.maxSlippage || 3}
                        onChange={(e) =>
                          setPresetConfig({
                            ...presetConfig,
                            maxSlippage: Number(e.target.value),
                          })
                        }
                        className="w-24 h-8"
                        min="0.1"
                        max="100"
                        step="0.1"
                      />
                      <span>%</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Only buy if slippage is under this percentage
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Deposit Wallet Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-3">Deposit Wallet</h3>

            {project?.addons?.SnipeBot?.depositWalletId?.publicKey ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Wallet Address:
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {project.addons.SnipeBot.depositWalletId.publicKey.slice(
                          0,
                          6
                        )}
                        ...
                        {project.addons.SnipeBot.depositWalletId.publicKey.slice(
                          -4
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() =>
                          copyToClipboard(
                            project?.addons?.SnipeBot?.depositWalletId
                              ?.publicKey || ''
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      BNB Balance:
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {isLoadingDepositWalletBalance
                          ? 'Loading...'
                          : depositWalletBalance !== null
                            ? `${depositWalletBalance.toFixed(4)} BNB`
                            : '0.0000 BNB'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={fetchDepositWalletBalance}
                        disabled={isLoadingDepositWalletBalance}
                      >
                        <RefreshCw
                          className={`h-3 w-3 ${isLoadingDepositWalletBalance ? 'animate-spin' : ''}`}
                        />
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpenBnbDepositDialog(true)}
                  >
                    Deposit BNB
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  This wallet will be used to distribute BNB to sniping wallets
                  and pay transaction fees.
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No deposit wallet is configured for this project.
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border rounded-lg p-4 bg-muted/10">
            <h3 className="text-base font-medium mb-3">Preset Summary</h3>
            <div className="space-y-2">
              <p>
                <span className="text-muted-foreground">Strategy:</span>{' '}
                {presetConfig.strategy === PresetStrategy.RAPID_SNIPE
                  ? 'Rapid Snipe'
                  : presetConfig.strategy === PresetStrategy.STAGGERED_SNIPE
                    ? 'Staggered Snipe'
                    : 'Passive Early Buy'}
              </p>

              {/* Strategy-specific summaries */}
              {presetConfig.strategy === PresetStrategy.RAPID_SNIPE && (
                <>
                  <p>
                    <span className="text-muted-foreground">Target Share:</span>{' '}
                    Up to {presetConfig.targetShare}% of tokens in the pool
                  </p>
                  <p>
                    <span className="text-muted-foreground">Wallets:</span>{' '}
                    {presetConfig.numberOfWallets} sniping wallets
                  </p>
                  <p>
                    <span className="text-muted-foreground">Time Frame:</span>{' '}
                    Only at TGE block
                  </p>
                </>
              )}

              {/* Staggered Snipe Summary */}
              {presetConfig.strategy === PresetStrategy.STAGGERED_SNIPE && (
                <>
                  <p>
                    <span className="text-muted-foreground">Total Share:</span>{' '}
                    Up to {presetConfig.totalShare}% of tokens in the pool
                  </p>
                  <p>
                    <span className="text-muted-foreground">Buy Stages:</span>{' '}
                    {presetConfig.buyStageCounts} stages
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Wallets Per Stage:
                    </span>{' '}
                    {presetConfig.minWallets} to {presetConfig.maxWallets}{' '}
                    wallets
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Time Between Buys:
                    </span>{' '}
                    {presetConfig.buyStageDuration === 'very short'
                      ? 'Very Short (30s)'
                      : presetConfig.buyStageDuration === 'medium'
                        ? 'Medium (2-5 min)'
                        : 'Long (15+ min)'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Max Slippage:</span>{' '}
                    {presetConfig.maxSlippage}%
                  </p>
                </>
              )}

              {/* Passive Early Buy Summary */}
              {presetConfig.strategy === PresetStrategy.PASSIVE_EARLY_BUY && (
                <>
                  <p>
                    <span className="text-muted-foreground">
                      Price Threshold:
                    </span>{' '}
                    {presetConfig.priceThreshold} BNB
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Target Amount:
                    </span>{' '}
                    {presetConfig.targetTokenAmount?.toLocaleString()} tokens
                  </p>
                  <p>
                    <span className="text-muted-foreground">Wallets:</span>{' '}
                    {presetConfig.numberOfWallets} wallets
                  </p>

                  <p>
                    <span className="text-muted-foreground">Max Slippage:</span>{' '}
                    {presetConfig.maxSlippage}%
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Apply Preset Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={goToPreviousStep}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Mode Selection
            </Button>
            <Button
              onClick={() => {
                // Apply preset configuration to actual sniping parameters

                // Set wallet count
                setWalletCount(String(presetConfig.numberOfWallets));

                // Set snipe percentage based on target share
                setSnipePercentage(presetConfig.targetShare || 30);

                // Apply strategy-specific settings
                if (presetConfig.strategy === PresetStrategy.RAPID_SNIPE) {
                  setSlippageTolerance(99); // High slippage for rapid snipe
                } else if (
                  presetConfig.strategy === PresetStrategy.STAGGERED_SNIPE
                ) {
                  setSlippageTolerance(50); // Moderate slippage for staggered
                } else {
                  // Passive Early Buy
                  setSlippageTolerance(presetConfig.maxSlippage || 3); // Low slippage for passive
                }

                // Set additional configuration based on the preset strategy
                // These will be applied when we move to the snipe configuration step
                setAdvancedConfig({
                  ...advancedConfig,
                  timing: {
                    ...advancedConfig.timing,
                    waitBlocks:
                      presetConfig.timeFrame === 'only at TGE block' ? 0 : 5,
                    pauseOnPriceSpike:
                      presetConfig.strategy ===
                      PresetStrategy.PASSIVE_EARLY_BUY,
                  },
                  stealth: {
                    ...advancedConfig.stealth,
                    splitBuys:
                      presetConfig.strategy === PresetStrategy.STAGGERED_SNIPE,
                    randomChunks:
                      presetConfig.strategy === PresetStrategy.STAGGERED_SNIPE
                        ? {
                            min:
                              presetConfig.buyStageDuration === 'very short'
                                ? 2
                                : presetConfig.buyStageDuration === 'medium'
                                  ? 3
                                  : 5,
                            max:
                              presetConfig.buyStageDuration === 'very short'
                                ? 4
                                : presetConfig.buyStageDuration === 'medium'
                                  ? 6
                                  : 10,
                          }
                        : advancedConfig.stealth.randomChunks,
                  },
                });

                // After applying preset, skip to wallet setup if in preset mode
                if (!isAdvancedMode) {
                  setCurrentStep(WizardStep.WALLET_SETUP);
                } else {
                  goToNextStep();
                }
              }}
            >
              Apply Preset
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        {renderNavigationFooter()}
      </CardContent>
    </Card>
  );

  // Utility function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Address copied to clipboard',
      });
    } catch (_err) {
      console.error('Error copying to clipboard:', _err);
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Function to handle wallet generation
  const handleGenerateWallets = async () => {
    try {
      setGeneratingWallets(true);
      setIsEstimating(true);

      // Get number of wallets to generate
      const count = parseInt(walletCount, 10) || 5;
      if (count <= 0) {
        throw new Error('Please enter a valid number of wallets');
      }

      // Get the project ID and bot ID
      const projectId = project?._id || '';
      const botId = project?.addons?.SnipeBot?._id || '';
      if (!projectId || !botId) {
        throw new Error('Project ID and SnipeBot ID are required');
      }

      //read counts of existing wallets
      console.log('wallets', wallets);
      const existingWallets = wallets.filter((w) => w.role !== 'botmain');
      const existingWalletCount = existingWallets.length;
      if (existingWalletCount > count) {
        const counts2delete = existingWalletCount - count;
        const addresses2Delete = existingWallets
          .slice(-counts2delete)
          .map((w) => w.publicKey || '');
        //delete extra wallets
        // get snipe bot id from project
        const snipeBotId = project?.addons?.SnipeBot?._id || '';
        await walletApi.deleteMultipleWallets(snipeBotId, addresses2Delete);
        setWallets(existingWallets.slice(0, count));
        setWalletCount(String(count));
        return;
      } else if (existingWalletCount < count) {
        // Dispatch the action to generate wallets
        const generatedWallets = await dispatch(
          generateWallets({
            projectId,
            count: count - existingWalletCount,
            botId,
          })
        ).unwrap();

        // Update wallets state
        if (generatedWallets) {
          const walletInfos: WalletInfo[] = generatedWallets.map((wallet) => ({
            _id: wallet._id,
            publicKey: wallet.publicKey,
            role: 'botsub', // Set default role for sub wallets
            bnbBalance: 0,
            tokenBalance: 0,
            sellPercentage: 100,
            insufficientBnb: 0,
            bnbSpendRate: 90, // Initialize bnbSpendRate to 90%
          }));

          setWallets(walletInfos);
          setGeneratingWallets(false);
          setIsEstimating(false);
        }
      }
    } catch (error) {
      console.error('Error generating wallets:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to generate wallets',
        variant: 'destructive',
      });
      setGeneratingWallets(false);
      setIsEstimating(false);
    }
  };

  // Utility functions to fix compilation errors
  // Function to fetch balances for wallet addresses
  const fetchBalances = async (addresses: string[]) => {
    if (
      !project?.tokenAddress ||
      !addresses.length ||
      balanceFetchInProgressRef.current
    )
      return;

    try {
      balanceFetchInProgressRef.current = true;

      const now = Date.now();
      const timeSinceLastUpdate = now - lastBalanceUpdateRef.current;

      if (timeSinceLastUpdate < MIN_BALANCE_UPDATE_INTERVAL) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_BALANCE_UPDATE_INTERVAL - timeSinceLastUpdate)
        );
      }

      setIsLoadingBalances(true);

      // Use the Redux thunk to get wallet balances
      const response = await dispatch(
        getWalletBalances({
          walletAddresses: addresses,
          tokenAddress: project.tokenAddress,
        })
      ).unwrap();

      // Map response to wallet info structure
      const updatedWallets = addresses.map((address) => {
        const balance = response.find(
          (b: any) => b.address.toLowerCase() === address.toLowerCase()
        );
        const existingWallet = wallets.find(
          (w) => w.publicKey.toLowerCase() === address.toLowerCase()
        );

        return {
          publicKey: address,
          role:
            address.toLowerCase() ===
            project?.addons.SnipeBot.depositWalletId?.publicKey.toLowerCase()
              ? 'botmain'
              : existingWallet?.role || 'sniping',
          _id: existingWallet?._id,
          bnbBalance: balance?.bnbBalance || 0,
          tokenBalance: balance?.tokenAmount || 0, // Use tokenAmount instead of tokenBalance
          bnbToSpend: existingWallet?.bnbToSpend || 0,
          bnbNeeded: existingWallet?.bnbNeeded || 0,
          tokenAmount: existingWallet?.tokenAmount || 0,
        };
      });

      setWalletCount(
        String(updatedWallets.filter((w) => w.role !== 'botmain').length)
      );
      setWallets(updatedWallets);
      lastBalanceUpdateRef.current = Date.now();
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch wallet balances',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBalances(false);
      balanceFetchInProgressRef.current = false;
    }
  };

  // Function to fetch connected wallet balance
  const fetchConnectedWalletBalance = async () => {
    if (!address || !project?.tokenAddress || isLoadingConnectedWalletBalance)
      return;

    try {
      setIsLoadingConnectedWalletBalance(true);

      // Use web3Utils directly as this isn't going through our backend
      const balances = await getWeb3WalletBalances(
        [address],
        project.tokenAddress
      );

      if (balances.length > 0) {
        setConnectedWalletBalance({
          bnb: balances[0].bnbBalance,
          token: balances[0].tokenAmount,
        });
      }
    } catch (error) {
      console.error('Error fetching connected wallet balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch connected wallet balance',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingConnectedWalletBalance(false);
    }
  };

  // Function to fetch deposit wallet balance
  const fetchDepositWalletBalance = async () => {
    if (
      !project?.addons?.SnipeBot?.depositWalletId?.publicKey ||
      isLoadingDepositWalletBalance
    )
      return;

    try {
      setIsLoadingDepositWalletBalance(true);
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_BSC_RPC_URL
      );

      // Get balance in ETH/BNB
      const balanceWei = await provider.getBalance(
        project.addons.SnipeBot.depositWalletId.publicKey
      );

      // Convert to ethers and format as number
      const balance = parseFloat(ethers.formatEther(balanceWei));

      setDepositWalletBalance(balance);
    } catch (error) {
      console.error('Error fetching deposit wallet balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch deposit wallet balance',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDepositWalletBalance(false);
    }
  };

  // Function to fetch LP token balance
  const fetchLpTokenBalance = async () => {
    if (!address || !project?.tokenAddress || lpTokenFetchInProgressRef.current)
      return;

    try {
      lpTokenFetchInProgressRef.current = true;
      setIsLoadingLpBalance(true);

      const balance = await getLPTokenBalance(address, project.tokenAddress);
      setLpTokenBalance(balance);
    } catch (error) {
      console.error('Error fetching LP token balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch LP token balance',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLpBalance(false);
      lpTokenFetchInProgressRef.current = false;
    }
  };

  // Function to fetch pool information
  const fetchPoolInfo = async () => {
    if (!project?.tokenAddress || isLoadingPoolInfo) return;

    try {
      setIsLoadingPoolInfo(true);
      const info = await getPoolInfo(project.tokenAddress);
      setPoolInfo(info);
    } catch (error) {
      console.error('Error fetching pool info:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pool information',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPoolInfo(false);
    }
  };

  // Function to handle removing liquidity
  const handleRemoveLiquidity = async () => {
    if (!project?.tokenAddress || !signer) {
      toast({
        title: 'Error',
        description: 'Missing required data',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRemovingLiquidity(true);
      const result = await removeLiquidity(
        signer,
        project.tokenAddress,
        removePercentage
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Liquidity removed successfully',
        });
      }
    } catch (error) {
      console.error('Error removing liquidity:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to remove liquidity',
        variant: 'destructive',
      });
    } finally {
      setIsRemovingLiquidity(false);
    }
  };

  // Function to handle burning liquidity
  const handleBurnLiquidity = async () => {
    if (!project?.tokenAddress || !signer) {
      toast({
        title: 'Error',
        description: 'Missing required data',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsBurningLiquidity(true);
      const result = await burnLiquidity(signer, project.tokenAddress);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Liquidity burned successfully',
        });
      }
    } catch (error) {
      console.error('Error burning liquidity:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to burn liquidity',
        variant: 'destructive',
      });
    } finally {
      setIsBurningLiquidity(false);
    }
  };

  // Function to handle fee estimation
  const handleEstimateFees = async () => {
    if (!project?.tokenAddress || isEstimatingFees) return;

    try {
      setIsEstimatingFees(true);

      // Filter only sniping wallets (not deposit wallet)
      const snipingWallets = wallets.filter((w) => w.role !== 'botmain');
      const depositWallet = wallets.find((w) => w.role === 'botmain');

      if (!depositWallet || !project?.addons?.SnipeBot?.depositWalletId) {
        toast({
          title: 'Error',
          description: 'Deposit wallet not found',
          variant: 'destructive',
        });
        return;
      }

      const tokenAmounts = snipingWallets.map((w) => w.tokenAmount || 0);

      const response = await BotService.estimateSnipeFees({
        projectId: project._id,
        botId: project.addons.SnipeBot._id,
        depositWallet: depositWallet.publicKey,
        subWallets: snipingWallets.map((w) => w.publicKey),
        tokenAmounts2Buy: tokenAmounts,
        tokenAddress: project.tokenAddress,
      });

      if (response.success) {
        const { data } = response;

        // Update the wallets with estimated BNB to spend
        const updatedWallets = wallets.map((wallet) => {
          if (wallet.role === 'botmain') {
            return wallet;
          }

          const requirement = data.subWalletRequirements.find(
            (r) => r.address.toLowerCase() === wallet.publicKey.toLowerCase()
          );

          return {
            ...wallet,
            bnbToSpend: requirement?.bnbToSpend || 0,
            bnbNeeded: requirement?.bnbNeeded || 0,
            insufficientBnb: requirement
              ? Math.max(0, requirement.bnbToSpend - (wallet.bnbBalance || 0))
              : 0,
          };
        });

        setWalletCount(
          String(updatedWallets.filter((w) => w.role !== 'botmain').length)
        );
        setWallets(updatedWallets);

        // Create simulation result
        const simulationData = {
          wallets: updatedWallets,
          totalBnbNeeded: data.totalBnbNeeded,
          snipingBnb: data.subWalletRequirements.reduce(
            (sum, r) => sum + r.bnbToSpend,
            0
          ),
          bnbForDistribution: data.subWalletRequirements.reduce(
            (sum, r) => sum + r.bnbNeeded,
            0
          ),
          tipBnb: data.depositWalletRequirements.bnbForTip,
          gasCost: data.depositWalletRequirements.gasCost,
          currentBnbBalance: data.depositWalletRequirements.currentBnb,
          currentTokenBalance: data.depositWalletRequirements.currentToken,
          tokenAmountRequired:
            data.depositWalletRequirements.tokenAmountRequired,
          sufficientBalance:
            Number(data.depositWalletRequirements.bnbNeeded) +
              Number(
                data.subWalletRequirements.reduce(
                  (sum, r) => sum + r.bnbNeeded,
                  0
                )
              ) +
              wallets
                .filter((w) => w.role !== 'botmain')
                .reduce(
                  (sum, wallet) => sum + (wallet.insufficientBnb || 0),
                  0
                ) <=
            0,
          gasDetails: data.estimatedGasCosts,
          poolSimulation: data.poolSimulation,
        };

        setFeeEstimationResult(simulationData);
        setEstimationResult(response);

        // Check if we have enough funds
        if (data.depositWalletRequirements.currentBnb < data.totalBnbNeeded) {
          setInsufficientFundsDetails({
            walletAddress: depositWallet.publicKey,
            walletType: 'Deposit Wallet',
            availableBnb: data.depositWalletRequirements.currentBnb,
            requiredBnb: data.totalBnbNeeded,
            missingBnb:
              data.totalBnbNeeded - data.depositWalletRequirements.currentBnb,
          });
        } else {
          setInsufficientFundsDetails(null);
        }

        toast({
          title: 'Success',
          description:
            'Fee estimation completed, please look at the Sniping Fee Estimation Results',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error?.includes('INSUFFICIENT_LIQUIDITY')
            ? 'There is not enough liquidity in the pool to perform this operation. Please try with a smaller amount or wait for more liquidity to be added.'
            : response.error || 'Failed to estimate fees',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error estimating fees:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to estimate fees',
        variant: 'destructive',
      });
    } finally {
      setIsEstimatingFees(false);
    }
  };

  // Function to handle BNB distribution
  const handleDistributeBnb = async () => {
    if (
      !project?.tokenAddress ||
      isDistributingBNBs ||
      !wallets.filter((w) => w.role !== 'botmain').length
    )
      return;

    try {
      setIsDistributingBNBs(true);

      // Filter only sniping wallets (not deposit wallet)
      const snipingWallets = wallets.filter((w) => w.role !== 'botmain');
      const depositWallet = wallets.find((w) => w.role === 'botmain');

      if (!depositWallet || !project?.addons?.SnipeBot?.depositWalletId) {
        toast({
          title: 'Error',
          description: 'Deposit wallet not found',
          variant: 'destructive',
        });
        return;
      }
      setInsufficientFundsDetails(null);
      //iterate through wallets and make zero to bnbToSpend and insufficientBnb
      setWallets((prevWallets) =>
        prevWallets.map((wallet) => ({
          ...wallet,
          bnbToSpend: 0,
          insufficientBnb: 0,
        }))
      );
      const response = await BotService.distributeBnb({
        depositWallet: depositWallet.publicKey,
        subWallets: snipingWallets.map((w) => w.publicKey),
        amounts: snipingWallets.map((w) => w.bnbNeeded || 0),
        projectId: project._id,
        botId: project.addons.SnipeBot._id,
      });
      if (response.success?.success) {
        setIsBnbDistributed(true);

        // Refresh balances after distribution
        setTimeout(() => {
          const allAddresses = [
            depositWallet.publicKey,
            ...snipingWallets.map((w) => w.publicKey),
          ];
          fetchBalances(allAddresses).then(() => {
            if (currentStep !== WizardStep.POST_OPERATION) handleEstimateFees();
          });
        }, 3000);

        toast({
          title: 'Success',
          description: 'BNB distributed successfully, refreshing balances.',
        });
      } else {
        // Check for insufficient balance error
        if (response.success?.error?.includes('Insufficient wallet balance')) {
          const match = response.success.error.match(
            /Required: ~([\d.]+) BNB, Found: ([\d.]+) BNB/
          );
          if (match) {
            const required = parseFloat(match[1]);
            const found = parseFloat(match[2]);
            const needed = (required - found).toFixed(6);
            toast({
              title: 'Insufficient Balance',
              description: `Failed to distribute BNB. You need to deposit ${needed} BNB to your deposit wallet and try again.`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description:
                response.success?.error ||
                response.message ||
                'Failed to distribute BNB',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Error',
            description:
              response.success?.error ||
              response.message ||
              'Failed to distribute BNB',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error distributing BNB:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to distribute BNB',
        variant: 'destructive',
      });
    } finally {
      setIsDistributingBNBs(false);
    }
  };

  const handleSimulate = async () => {
    if (!project?.addons?.SnipeBot) return;

    const depositWallet = project?.addons.SnipeBot.depositWalletId;
    if (!depositWallet) {
      toast({
        title: 'Error',
        description: 'Deposit wallet not found',
        variant: 'destructive',
      });
      return;
    }

    // Check if we have estimation results
    if (!estimationResult) {
      toast({
        title: 'Error',
        description: 'Please estimate fees first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSimulating(true);

      // Filter out wallets without _id
      const snipingWallets = wallets.filter((w) => w.role !== 'botmain');
      if (snipingWallets.length === 0) {
        throw new Error('No valid Snipnig wallets found');
      }

      setInsufficientFundsDetails(null);
      //iterate through wallets and make zero to bnbToSpend and insufficientBnb
      setWallets((prevWallets) =>
        prevWallets.map((wallet) => ({
          ...wallet,
          bnbToSpend: 0,
          insufficientBnb: 0,
        }))
      );

      // Simulate the snipe operation
      const result = await BotService.simulateSnipe({
        projectId: project?._id,
        botId: project?.addons.SnipeBot._id,
        depositWallet: depositWallet.publicKey,
        subWallets: wallets
          .filter((w) => w.role !== 'botmain')
          .map((w) => w.publicKey),
        tokenAmounts2Buy: wallets
          .filter((w) => w.role !== 'botmain')
          .map((w) => w.tokenAmount || 0),
        tokenAddress: project?.tokenAddress,
      });

      setSimulationResult(result);
      if (!result.success) {
        // Check if the error is related to insufficient funds
        if (result.error && result.error.includes('Insufficient funds')) {
          // Extract wallet address, available amount, and required amount from the error message
          const errorMsg = result.error;
          const addressMatch = errorMsg.match(/address\s+([0-9a-fA-Fx]+)/);
          const amountsMatch = errorMsg.match(/have\s+(\d+)\s+want\s+(\d+)/);

          if (addressMatch && amountsMatch) {
            const walletAddress = addressMatch[1];
            const availableWei = BigInt(amountsMatch[1]);
            const requiredWei = BigInt(amountsMatch[2]);

            // Convert from wei to BNB (1 BNB = 10^18 wei)
            const availableBnb = Number(availableWei) / 1e18;
            const requiredBnb = Number(requiredWei) / 1e18;
            const missingBnb = Number(requiredWei - availableWei) / 1e18;

            // Find which wallet has insufficient funds
            const walletType =
              wallets.find(
                (w) =>
                  w.publicKey?.toString()?.toLowerCase() ===
                  walletAddress?.toString()?.toLowerCase()
              )?.role === 'botmain'
                ? 'Deposit Wallet'
                : 'Sniping Wallet';

            // Update simulation result to reflect insufficient balance
            setEstimationResult((prev: any) => {
              if (!prev) return null;
              return {
                ...prev,
                sufficientBalance: missingBnb <= 0 ? true : false,
                totalBnbNeeded: prev.totalBnbNeeded + missingBnb,
              };
            });

            // Set insufficient funds details
            setInsufficientFundsDetails({
              walletAddress,
              walletType,
              availableBnb,
              requiredBnb,
              missingBnb,
            });

            // Update the wallet with the insufficientBnb property
            setWallets((prevWallets) =>
              prevWallets.map((wallet) =>
                wallet.publicKey === walletAddress
                  ? {
                      ...wallet,
                      bnbNeeded: Number(wallet.bnbNeeded) + Number(missingBnb),
                      insufficientBnb: missingBnb,
                    }
                  : wallet
              )
            );

            // Show detailed error message
            toast({
              title: 'Insufficient BNB Balance',
              description: `${walletType} (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}) has ${availableBnb.toFixed(6)} BNB but needs ${requiredBnb.toFixed(6)} BNB. Missing ${missingBnb.toFixed(6)} BNB.`,
              variant: 'destructive',
            });

            // Return early to prevent the generic error message
            return;
          }
        }

        // If not an insufficient funds error or couldn't parse it, throw the original error
        throw new Error(result.error || 'Simulation failed');
      }

      toast({
        title: 'Success',
        description:
          'Snipe simulation completed successfully. Go on proceed Execution.',
      });

      setIsSimulating(false);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to simulate snipe',
        variant: 'destructive',
      });

      setIsSimulating(false);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExecute = async () => {
    // Change this check to not strictly require simulation results
    if (!project?.addons?.SnipeBot) {
      toast({
        title: 'Error',
        description:
          'Cannot execute: Invalid state or missing bot configuration',
        variant: 'destructive',
      });
      return;
    }

    // Reset states
    setExecutionSuccess(false);
    setIsExecuting(true);

    // If we have simulation results and they show insufficient balance, don't proceed
    if (feeEstimationResult && !feeEstimationResult?.sufficientBalance) {
      toast({
        title: 'Error',
        description: 'Cannot execute: insufficient balance',
        variant: 'destructive',
      });
      return;
    }

    // Reset insufficient funds details when starting execution
    setInsufficientFundsDetails(null);
    //iterate through wallets and make zero to bnbToSpend and insufficientBnb
    setWallets((prevWallets) =>
      prevWallets.map((wallet) => ({
        ...wallet,
        bnbToSpend: 0,
        insufficientBnb: 0,
      }))
    );

    const depositWallet = project?.addons.SnipeBot.depositWalletId;
    if (!depositWallet) {
      toast({
        title: 'Error',
        description: 'Deposit wallet not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExecuting(true);

      // Filter out wallets without _id
      const subWallets = wallets.filter((w) => w.role !== 'botmain');
      if (subWallets.length === 0) {
        throw new Error('No valid Snipnig wallets found');
      }

      const result = await BotService.executeSnipe({
        projectId: project?._id,
        botId: project?.addons.SnipeBot._id,
        depositWallet: depositWallet.publicKey,
        subWallets: wallets
          .filter((w) => w.role !== 'botmain')
          .map((w) => w.publicKey),
        tokenAmounts2Buy: wallets
          .filter((w) => w.role !== 'botmain')
          .map((w) => w.tokenAmount || 0),
        tokenAddress: project?.tokenAddress,
      });

      if (result.success) {
        setExecutionSuccess(true);
        toast({
          title: 'Success',
          description:
            'Snipe executed successfully, now refreshing balances. Please go to next step to sell tokens',
        });

        // Refresh balances after successful sell
        const allAddresses = [
          ...(project?.addons.SnipeBot.depositWalletId?.publicKey
            ? [project?.addons.SnipeBot.depositWalletId.publicKey]
            : []),
          ...wallets
            .filter((w) => w.role !== 'botmain')
            .map((w) => w.publicKey),
        ];
        fetchBalances(allAddresses);
      } else {
        throw new Error(result.error || 'Execution failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to execute snipe',
        variant: 'destructive',
      });
      setIsExecuting(false);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSingleSell = async (
    walletAddress: string,
    sellPercentage: number
  ) => {
    try {
      setInsufficientFundsDetails(null);
      setWallets((prevWallets) =>
        prevWallets.map((w) => ({
          ...w,
          bnbToSpend: 0,
          insufficientBnb: 0,
        }))
      );
      setExecutingSingleSells((prev) => ({ ...prev, [walletAddress]: true }));
      const result = await BotService.singleWalletSell({
        projectId: project?._id || (projectId as string) || '',
        botId: project?.addons.SnipeBot._id || '',
        walletAddress,
        tokenAddress: project?.tokenAddress || '',
        sellPercentage,
        slippageTolerance,
        targetWalletAddress:
          project?.addons?.SnipeBot?.depositWalletId?.publicKey,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Tokens sold successfully',
        });
        // Refresh balances after successful sell
        const allAddresses = [
          ...(project?.addons.SnipeBot.depositWalletId?.publicKey
            ? [project?.addons.SnipeBot.depositWalletId.publicKey]
            : []),
          ...wallets
            .filter((w) => w.role !== 'botmain')
            .map((w) => w.publicKey),
        ];
        fetchBalances(allAddresses);
      } else {
        const errorMessage = result.error
          ? result.error
          : 'Failed to sell tokens';
        const errorDetails = errorMessage || '';
        let errorString = '';

        if (typeof errorDetails === 'string') {
          errorString = errorDetails;
        } else if (typeof errorDetails === 'object' && errorDetails !== null) {
          // Cast errorDetails to unknown first, then to object type to safely access properties
          const errorObj = errorDetails as unknown as {
            originalError?: string;
          };
          errorString = errorObj.originalError || String(errorDetails);
        }

        // Check for insufficient BNB balance error
        const insufficientBnbMatch = errorString.match(
          /Insufficient BNB balance for fees\. Required: ([\d.]+) BNB, Available: ([\d.]+) BNB/
        );

        // Check for PancakeRouter INSUFFICIENT_OUTPUT_AMOUNT error
        const insufficientOutputMatch = errorString.includes(
          'PancakeRouter: INSUFFICIENT_OUTPUT_AMOUNT'
        );

        if (insufficientBnbMatch) {
          const requiredBnb = insufficientBnbMatch[1];
          const availableBnb = insufficientBnbMatch[2];

          setInsufficientFundsDetails({
            walletAddress: walletAddress,
            walletType: 'botsub',
            availableBnb: Number(availableBnb),
            requiredBnb: Number(requiredBnb),
            missingBnb: Number(requiredBnb) - Number(availableBnb),
          });
          setWallets((prevWallets) =>
            prevWallets.map((wallet) =>
              wallet.publicKey === walletAddress
                ? {
                    ...wallet,
                    bnbNeeded: Number(wallet.bnbNeeded) + Number(requiredBnb),
                    insufficientBnb: Number(requiredBnb),
                  }
                : wallet
            )
          );
          toast({
            title: 'Error',
            description: `Failed to sell tokens. You need to add ${requiredBnb} BNB to the sniping wallet (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}) to proceed. Available: ${availableBnb} BNB`,
            variant: 'destructive',
          });
        } else if (insufficientOutputMatch) {
          toast({
            title: 'Transaction Failed',
            description:
              'The price impact is too high. Try selling a smaller amount.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Transaction Failed',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to sell tokens',
        variant: 'destructive',
      });
    } finally {
      setExecutingSingleSells((prev) => ({ ...prev, [walletAddress]: false }));
    }
  };

  const handleMultiSell = async () => {
    // Filter wallets that are selected for multi-sell and have token balance > 0
    const selectedWallets = wallets.filter(
      (w) => w.isSelectedForMutilSell && (w.tokenBalance || 0) > 0
    );

    if (selectedWallets.length === 0) {
      toast({
        title: 'Error',
        description:
          'No wallets selected with sufficient token balance for multi-sell',
        variant: 'destructive',
      });
      return;
    }

    try {
      setInsufficientFundsDetails(null);
      setWallets((prevWallets) =>
        prevWallets.map((w) => ({
          ...w,
          bnbToSpend: 0,
          insufficientBnb: 0,
        }))
      );
      setIsExecutingMultiSell(true);

      const result = (await BotService.multiWalletSell({
        projectId: project?._id || (projectId as string) || '',
        botId: project?.addons.SnipeBot._id || '',
        walletAddresses: selectedWallets.map((w) => w.publicKey),
        tokenAddress: project?.tokenAddress || '',
        sellPercentages: selectedWallets.map((w) => w.sellPercentage || 100), // Default to 100% if not set
        slippageTolerance,
        targetWalletAddress:
          project?.addons.SnipeBot?.depositWalletId?.publicKey,
      })) as MultiSellResult;

      if (result.success) {
        toast({
          title: 'Success',
          description:
            'Tokens sold successfully from all selected wallets, Now refreshing balances',
        });
        // Refresh balances after successful sell
        const allAddresses = [
          ...(project?.addons.SnipeBot.depositWalletId?.publicKey
            ? [project?.addons.SnipeBot.depositWalletId.publicKey]
            : []),
          ...wallets
            .filter((w) => w.role !== 'botmain')
            .map((w) => w.publicKey),
        ];
        fetchBalances(allAddresses);
      } else {
        if (result.failedTransactions > 0 && result.errors.length > 0) {
          const errorMessages = result.errors
            .map((tx) => {
              const insufficientBnbMatch = tx.error.match(
                /Insufficient gas funds\. Required: ([\d.]+) BNB, Available: ([\d.]+) BNB/
              );

              if (insufficientBnbMatch) {
                const requiredBnb = insufficientBnbMatch[1];
                const availableBnb = insufficientBnbMatch[2];
                setInsufficientFundsDetails({
                  walletAddress: tx.wallet,
                  walletType: 'botsub',
                  availableBnb: Number(availableBnb),
                  requiredBnb: Number(requiredBnb),
                  missingBnb: Number(requiredBnb) - Number(availableBnb),
                });
                setWallets((prevWallets) =>
                  prevWallets.map((wallet) =>
                    wallet.publicKey === tx.wallet
                      ? {
                          ...wallet,
                          bnbNeeded:
                            Number(wallet.bnbNeeded) + Number(requiredBnb),
                          insufficientBnb: Number(requiredBnb),
                        }
                      : wallet
                  )
                );
                return `Failed to sell tokens. You need to add ${requiredBnb} BNB to the sniping wallet (${tx.wallet.slice(0, 6)}...${tx.wallet.slice(-4)}) to proceed. Available: ${availableBnb} BNB`;
              } else {
                return tx.error;
              }
            })
            .join('\n');
          throw new Error(`Failed transactions:\n${errorMessages}`);
        } else {
          throw new Error(result.error || 'Failed to sell tokens');
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to sell tokens',
        variant: 'destructive',
      });
    } finally {
      setIsExecutingMultiSell(false);
    }
  };

  const handleCollectBnb = async () => {
    // Filter wallets that are selected for collection and have BNB balance > 0
    const selectedWallets = wallets.filter(
      (w) =>
        w.isSelectedForMutilSell &&
        w.role !== 'botmain' &&
        (w.bnbBalance || 0) > 0.00002
    );

    if (selectedWallets.length === 0) {
      toast({
        title: 'Error',
        description:
          'No wallets selected with sufficient BNB balance for collection',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCollectingBnb(true);
      const result = await BotService.collectBnb({
        projectId: project?._id || (projectId as string) || '',
        botId: project?.addons.SnipeBot._id || '',
        walletAddresses: selectedWallets.map((w) => w.publicKey),
        targetWallet:
          project?.addons.SnipeBot?.depositWalletId?.publicKey || '',
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'BNB collected successfully from all selected wallets',
        });
        // Refresh balances after successful collection
        const allAddresses = [
          ...(project?.addons.SnipeBot.depositWalletId?.publicKey
            ? [project?.addons.SnipeBot.depositWalletId.publicKey]
            : []),
          ...wallets
            .filter((w) => w.role !== 'botmain')
            .map((w) => w.publicKey),
        ];
        fetchBalances(allAddresses);
      } else {
        throw new Error(result.error || 'Failed to collect BNB');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to collect BNB',
        variant: 'destructive',
      });
    } finally {
      setIsCollectingBnb(false);
    }
  };

  // Handler function to execute buy operation for a single wallet
  const handleSingleBuy = async (walletAddress: string) => {
    try {
      setInsufficientFundsDetails(null);
      setWallets((prevWallets) =>
        prevWallets.map((w) => ({
          ...w,
          bnbToSpend: 0,
          insufficientBnb: 0,
        }))
      );
      setExecutingSingleBuys((prev) => ({ ...prev, [walletAddress]: true }));

      // Find the wallet to get its bnbSpendRate
      const wallet = wallets.find((w) => w.publicKey === walletAddress);
      const bnbSpendRate = wallet?.bnbSpendRate || 90; // Default to 90% if not specified

      const result = await BotService.singleWalletBuy({
        projectId: project?._id || (projectId as string) || '',
        botId: project?.addons.SnipeBot._id || '',
        walletAddress,
        tokenAddress: project?.tokenAddress || '',
        slippageTolerance,
        targetWalletAddress: walletAddress,
        bnbSpendRate,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Tokens bought successfully',
        });
        // Refresh balances after successful buy
        const allAddresses = [
          ...(project?.addons.SnipeBot.depositWalletId?.publicKey
            ? [project?.addons.SnipeBot.depositWalletId.publicKey]
            : []),
          ...wallets
            .filter((w) => w.role !== 'botmain')
            .map((w) => w.publicKey),
        ];
        fetchBalances(allAddresses);
      } else {
        console.log(result);
        const errorMessage = result.error
          ? result.error
          : 'Failed to buy tokens';
        let errorString = errorMessage; // Changed to use errorMessage as the default

        if (typeof errorMessage === 'string') {
          errorString = errorMessage;
        } else if (typeof errorMessage === 'object' && errorMessage !== null) {
          const errorObj = errorMessage as unknown as {
            originalError?: string;
          };
          errorString = errorObj.originalError || String(errorMessage);
        }

        // Check for insufficient BNB balance error (first pattern)
        const insufficientBnbMatch = errorString.match(
          /Insufficient BNB balance for fees\. Required: ([\d.]+) BNB, Available: ([\d.]+) BNB/
        );
        // Check for alternative insufficient funds error pattern
        const alternativeInsufficientMatch = errorString.match(
          /Insufficient funds for transaction\. Required: ([\d.]+) BNB plus gas, Available: ([\d.]+) BNB/i
        );

        if (insufficientBnbMatch || alternativeInsufficientMatch) {
          const match = insufficientBnbMatch || alternativeInsufficientMatch;
          const requiredBnb = match![1];
          const availableBnb = match![2];
          const targetWalletAddress = result?.walletAddress || walletAddress;

          setInsufficientFundsDetails({
            walletAddress: targetWalletAddress,
            walletType: 'botsub',
            availableBnb: Number(availableBnb),
            requiredBnb: Number(requiredBnb),
            missingBnb: Number(requiredBnb),
          });
          setWallets((prevWallets) =>
            prevWallets.map((wallet) =>
              wallet.publicKey === targetWalletAddress
                ? {
                    ...wallet,
                    bnbNeeded: Number(requiredBnb),
                    insufficientBnb: Number(requiredBnb),
                  }
                : wallet
            )
          );
          toast({
            title: 'Error',
            description: `Failed to buy tokens. You need to add ${requiredBnb} BNB to the wallet (${targetWalletAddress.slice(0, 6)}...${targetWalletAddress.slice(-4)}) to proceed. Available: ${availableBnb} BNB`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Transaction Failed',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to buy tokens',
        variant: 'destructive',
      });
    } finally {
      setExecutingSingleBuys((prev) => ({ ...prev, [walletAddress]: false }));
    }
  };

  const handleDownloadWalletInfo = () => {
    if (!project || wallets.length === 0) {
      toast({
        title: 'No Data Available',
        description: 'There is no wallet data to download.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Format wallet data
      const walletsForExport = wallets.map((wallet) => ({
        Role: wallet.role === 'botmain' ? 'Deposit' : 'Sniping',
        Address: wallet.publicKey,
        'BNB Balance': wallet.bnbBalance ? wallet.bnbBalance.toFixed(6) : '0',
        'Token Balance': wallet.tokenBalance
          ? wallet.tokenBalance.toString()
          : '0',
      }));

      // Convert to CSV
      const headers = Object.keys(walletsForExport[0]).join(',');
      const rows = walletsForExport
        .map((row) =>
          Object.values(row)
            .map((value) =>
              typeof value === 'string' && value.includes(',')
                ? `"${value}"`
                : value
            )
            .join(',')
        )
        .join('\n');
      const csv = `${headers}\n${rows}`;

      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute(
        'download',
        `${project.name.replace(/\s+/g, '_')}_wallets_${new Date().toISOString().slice(0, 10)}.csv`
      );
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Wallet information downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading wallet info:', error);
      toast({
        title: 'Error',
        description: 'Failed to download wallet information',
        variant: 'destructive',
      });
    }
  };

  const handleDistributeExtraBnb = async () => {
    if (distributeAmount <= 0) {
      toast({
        title: 'Recommendation',
        description: 'Please enter a valid amount to distribute',
        variant: 'default',
      });
      return;
    }
    try {
      const depositWallet = project?.addons?.SnipeBot?.depositWalletId;
      if (!depositWallet) {
        toast({
          title: 'Error',
          description: 'Deposit wallet not found',
          variant: 'destructive',
        });
        return;
      }

      // Calculate amounts for each wallet based on the even distribution
      const subWalletAddresses = project?.addons.SnipeBot.subWalletIds
        .filter((w: SubWallet) => w.publicKey)
        .map((w: SubWallet) => w.publicKey);

      if (!subWalletAddresses.length) {
        toast({
          title: 'Error',
          description: 'No sniping wallets found',
          variant: 'destructive',
        });
        return;
      }

      // Calculate the even distribution amount for each wallet
      const perWalletAmount = distributeAmount;
      const amounts = subWalletAddresses.map(() => perWalletAmount);

      setIsDistributingBNBs(true);

      setInsufficientFundsDetails(null);
      //iterate through wallets and make zero to bnbToSpend and insufficientBnb
      setWallets((prevWallets) =>
        prevWallets.map((wallet) => ({
          ...wallet,
          bnbToSpend: 0,
          insufficientBnb: 0,
        }))
      );

      const response = await BotService.distributeBnb({
        depositWallet: depositWallet.publicKey,
        subWallets: subWalletAddresses,
        amounts,
        projectId: project?._id || '',
        botId: project?.addons.SnipeBot._id || '',
      });

      if (response.success?.success) {
        setIsBnbDistributed(true);

        // Refresh balances after distribution
        setTimeout(() => {
          const allAddresses = [depositWallet.publicKey, ...subWalletAddresses];
          fetchBalances(allAddresses).then(() => {
            handleEstimateFees();
          });
        }, 3000);

        toast({
          title: 'Success',
          description:
            'Extra BNB distributed successfully, automatically estimating fees again.',
        });
      } else {
        // Check for insufficient balance error
        if (response.success?.error?.includes('Insufficient wallet balance')) {
          const match = response.success.error.match(
            /Required: ~([\d.]+) BNB, Found: ([\d.]+) BNB/
          );
          if (match) {
            const required = parseFloat(match[1]);
            const found = parseFloat(match[2]);
            const needed = (required - found).toFixed(6);
            toast({
              title: 'Insufficient Balance',
              description: `Failed to distribute Extra BNB. You need to deposit ${needed} BNB to your deposit wallet and try again.`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description:
                response.success?.error ||
                response.message ||
                'Failed to distribute Extra BNB',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Error',
            description:
              response.success?.error ||
              response.message ||
              'Failed to distribute Extra BNB',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error distributing extra BNB:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to distribute extra BNB',
        variant: 'destructive',
      });
    } finally {
      setIsDistributingBNBs(false);
    }
  };

  // Add these imports at the top of the file
  useEffect(() => {
    // Fetch project bots when project changes
    if (project?._id && project?.addons?.SnipeBot) {
      const depositWalletId = project.addons.SnipeBot.depositWalletId;
      const subWalletIds = project.addons.SnipeBot.subWalletIds || [];

      // Get addresses
      const addresses = [
        ...(depositWalletId ? [depositWalletId.publicKey] : []),
        ...subWalletIds.map((w: SubWallet) => w.publicKey),
      ];

      // Fetch balances
      if (addresses.length > 0) {
        fetchBalances(addresses);
      }

      // Fetch pool info if token address exists
      if (project.tokenAddress) {
        fetchPoolInfo();
      }

      // Fetch connected wallet balance and LP token balance if wallet is connected
      if (address && project.tokenAddress) {
        fetchConnectedWalletBalance();
        fetchLpTokenBalance();
      }
    }
  }, [project, address]);

  // Update wallets state when subWalletIds changes
  useEffect(() => {
    if (project?.addons?.SnipeBot?.subWalletIds) {
      const depositWallet = project.addons.SnipeBot.depositWalletId;
      const subWallets = project.addons.SnipeBot.subWalletIds;

      const newWallets: WalletInfo[] = [];

      // Add deposit wallet if it exists
      if (depositWallet) {
        newWallets.push({
          _id: depositWallet._id,
          publicKey: depositWallet.publicKey,
          role: 'botmain',
          sellPercentage: 100,
          isSelectedForMutilSell: false,
          insufficientBnb: 0,
        });
      }

      // Add sub wallets
      subWallets.forEach((wallet) => {
        newWallets.push({
          _id: wallet._id,
          publicKey: wallet.publicKey,
          role: wallet.role || 'botsub',
          sellPercentage: 100,
          isSelectedForMutilSell: false,
          insufficientBnb: 0,
          bnbSpendRate: 90, // Default to 90% BNB spend rate
        });
      });

      setWallets(newWallets);

      // Fetch wallet balances
      const allAddresses = [
        ...(depositWallet ? [depositWallet.publicKey] : []),
        ...subWallets.map((w) => w.publicKey),
      ];
      fetchBalances(allAddresses);
    }
  }, [
    project?.addons?.SnipeBot?.subWalletIds,
    project?.addons?.SnipeBot?.depositWalletId,
  ]);

  const handleMultiBuy = async () => {
    // Filter wallets that are selected and have BNB balance
    const selectedWallets = wallets.filter(
      (w) =>
        w.isSelectedForMutilSell &&
        w.role !== 'botmain' &&
        (w.bnbBalance || 0) > 0
    );

    if (selectedWallets.length === 0) {
      toast({
        title: 'Error',
        description:
          'No wallets selected with sufficient BNB balance for multi-buy',
        variant: 'destructive',
      });
      return;
    }

    try {
      setInsufficientFundsDetails(null);
      setWallets((prevWallets) =>
        prevWallets.map((w) => ({
          ...w,
          bnbToSpend: 0,
          insufficientBnb: 0,
        }))
      );
      setIsExecutingMultiBuy(true);

      const result = await BotService.multiWalletBuy({
        projectId: project?._id || (projectId as string) || '',
        botId: project?.addons.SnipeBot._id || '',
        walletAddresses: selectedWallets.map((w) => w.publicKey),
        tokenAddress: project?.tokenAddress || '',
        slippageTolerance,
        bnbSpendRates: selectedWallets.map((w) => w.bnbSpendRate || 90), // Default to 90% if not set
      });

      if (result.success) {
        toast({
          title: 'Success',
          description:
            'Tokens bought successfully from all selected wallets, Now refreshing balances',
        });
        // Refresh balances after successful buy
        const allAddresses = [
          ...(project?.addons.SnipeBot.depositWalletId?.publicKey
            ? [project?.addons.SnipeBot.depositWalletId.publicKey]
            : []),
          ...wallets
            .filter((w) => w.role !== 'botmain')
            .map((w) => w.publicKey),
        ];
        fetchBalances(allAddresses);
      } else {
        throw new Error(result.error || 'Failed to buy tokens');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to buy tokens',
        variant: 'destructive',
      });
    } finally {
      setIsExecutingMultiBuy(false);
    }
  };

  // Add this helper function to render consistent navigation buttons in each step
  const renderNavigationFooter = (
    disableNext: boolean = false,
    disablePrevious: boolean = false,
    nextLabel: string = 'Next Step',
    showFinish: boolean = false
  ) => (
    <div className="flex justify-between space-x-2 mt-6 pt-4 border-t">
      <Button
        variant="outline"
        onClick={goToPreviousStep}
        disabled={disablePrevious || currentStep === WizardStep.INTRODUCTION}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Previous
      </Button>
      <div className="flex space-x-2">
        {showFinish ? (
          <Button
            onClick={onOpenChange ? () => onOpenChange(false) : undefined}
            variant="default"
          >
            Finish
            <CheckCircle2 className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={goToNextStep}
            disabled={disableNext || currentStep === WizardStep.POST_OPERATION}
          >
            {nextLabel}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  // Render the dialog with a summary panel
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Bundle Sniping Wizard</DialogTitle>
        </DialogHeader>

        {/* Wizard content area */}
        <div className="flex flex-col space-y-4 max-h-[70vh] overflow-y-auto p-1">
          {renderStepContent()}
        </div>
      </DialogContent>

      {/* BNB Deposit Dialog */}
      {project?.addons?.SnipeBot?.depositWalletId?.publicKey && (
        <BnbDepositDialog
          open={isOpenBnbDepositDialog}
          onOpenChange={setIsOpenBnbDepositDialog}
          depositWalletAddress={
            project.addons.SnipeBot.depositWalletId.publicKey
          }
          onSuccess={fetchDepositWalletBalance}
        />
      )}
    </Dialog>
  );
}
