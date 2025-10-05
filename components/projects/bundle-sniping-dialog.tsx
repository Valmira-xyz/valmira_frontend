'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ethers } from 'ethers';
import {
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAccount, useChainId, useDisconnect } from 'wagmi';

import { NativeDepositDialog } from '@/components/projects/native-deposit-dialog';
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
  getPoolInfo,
  getTokenOwner,
  getWalletBalances,
  isTokenTradingEnabled,
} from '@/services/web3Utils';
import { logout } from '@/store/slices/authSlice';
import { fetchProject } from '@/store/slices/projectSlice';
import { generateWallets } from '@/store/slices/walletSlice';
import type { AppDispatch, RootState } from '@/store/store';
import type { Project, ProjectWithAddons } from '@/types';

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
  nativeToSpend?: number;
  nativeBalance?: number;
  tokenBalance?: number; // current token balance
  tokenAmount?: number; // buying token amount
  nativeFinalInsufficient?: number;
  sellPercentage?: number;
  isSelectedForMutilSell?: boolean;
  privateKey?: string; // Add privateKey property
  nativeSpendRate?: number; // Add nativeSpendRate property (percentage of wallet balance to use for buying)
}

interface LiquidationSnipeBotAddon {
  subWalletIds: SubWallet[];
  depositWalletId?: {
    publicKey: string;
    _id: string;
  };
  _id: string;
}

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
  nativeReserve: number;
  tokenReserve: number;
  tokenAddress: string;
  nativeAddress: string;
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
  onConfigurationSuccess?: () => void;
};

// Define new preset strategy types
export enum PresetStrategy {
  RAPID_SNIPE = 'rapid_snipe',
  STAGGERED_SNIPE = 'staggered_snipe',
  PASSIVE_EARLY_BUY = 'passive_early_buy',
}

export interface PresetConfig {
  // common
  strategy: PresetStrategy;
  snipeAmount: number; // Total snipe amount
  snipeAmountUnit: string; // Total snipe amount unit
  walletCount: number;
  maxSlippage: number; // Max slippage allowed
  timeFrame: string; // e.g., "within first 30 minutes of launch" or "only at TGE block"

  // staggered snipe
  stageMinWalletCount: number; // Min wallets for staggered snipe
  stageMaxWalletCount: number; // Max wallets for staggered snipe
  stageTimeDelta: string; // Time between buys for staggered snipe
  stageCount: number; // Number of buy stages for staggered snipe

  // passive early buy
  priceThreshold: number; // Price threshold for passive early buy
  priceThresholdUnit: string; // Price threshold unit for passive early buy
  expirationTime: number; // Expiration time for passive early buy
}

// Define the wizard steps
enum WizardStep {
  INTRODUCTION = 0,
  MODE_SELECTION, // New step for mode selection
  PRESET_CONFIGURATION, // New step for preset configuration
  PRESET_EXECUTION, // New step for preset execution monitoring
  PRESET_SELLING_BOARD, // New step for preset selling board
  WALLET_SETUP,
  SNIPE_CONFIGURATION,
  // FEE_DISTRIBUTION,
  // SIMULATION,
  // EXECUTION,
  POST_OPERATION,
}

export function BundleSnipingDialog({
  open,
  onOpenChange,
  onConfigurationSuccess,
}: SnipeWizardDialogProps) {
  // then read project id from url
  const params = useParams();
  const projectId = params?.id as string;
  // Initialize project state
  const [project, setProject] = useState<ExtendedProject | null>(null);
  // Track the current wizard step
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    WizardStep.INTRODUCTION
  );

  // Mode selection state
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Preset configuration state
  const [presetConfig, setPresetConfig] = useState<PresetConfig>({
    strategy: PresetStrategy.RAPID_SNIPE,
    snipeAmount: 1, // Default to 70%
    snipeAmountUnit: 'percentage',
    walletCount: 30,
    maxSlippage: 3, // Default for Passive Early Buy
    timeFrame: 'only at TGE block', // Default for Rapid Snipe

    // staggered snipe
    stageMinWalletCount: 5, // Min wallets for staggered snipe
    stageMaxWalletCount: 10, // Max wallets for staggered snipe
    stageTimeDelta: 'medium', // Time between buys for staggered snipe
    stageCount: 1, // Number of buy stages for staggered snipe

    priceThreshold: 1, // Default for Passive Early Buy (in USD)
    priceThresholdUnit: 'USD', // Default for Passive Early Buy
    expirationTime: 86400,
  });

  // Advanced mode configuration state
  const [advancedConfig, setAdvancedConfig] = useState({
    snipePhases: [
      {
        name: 'TGE Snipe',
        percentage: 70,
        priorityFee: 'high',
        isSelected: false,
      },
      {
        name: 'Post-Launch',
        percentage: 20,
        priorityFee: 'medium',
        isSelected: false,
      },
      {
        name: 'Marketing Surge',
        percentage: 10,
        priorityFee: 'low',
        isSelected: true,
      },
    ],
    timing: {
      waitBlocks: 0,
      randomTimeOffset: { min: 3, max: 15 }, // seconds
      pauseOnPriceSpike: true,
      priceSpikeTrigger: 20, // %
    },
    stealth: {
      splitBuys: false,
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

  // additional advanced mode config
  const [distributionMode, setDistributionMode] = useState<'random' | 'manual'>(
    'random'
  );
  const [walletPercents, setWalletPercents] = useState<{
    [address: string]: number;
  }>({});
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [walletCount, setWalletCount] = useState(
    String(project?.addons?.SnipeBot?.subWalletIds?.length || 0)
  ); // Add string type for walletCount
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [extraDistributeNativeAmount, setExtraDistributeNativeAmount] =
    useState<number>(0.001);

  // progress states
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isLoadingPoolInfo, setIsLoadingPoolInfo] = useState(false);
  const [isLoadingDepositWalletBalance, setIsLoadingDepositWalletBalance] =
    useState(false);

  const [isExecutingMultiSell, setIsExecutingMultiSell] = useState(false);
  const [isCollectingNative, setIsCollectingNative] = useState(false);
  const [isExecutingMultiBuy, setIsExecutingMultiBuy] = useState(false);
  const [isPresetExecuting, setIsPresetExecuting] = useState(false);
  const [isOpenNativeDepositDialog, setIsOpenNativeDepositDialog] =
    useState(false);
  const [presetExecutionStatus, setPresetExecutionStatus] =
    useState<string>('');
  const [isNeedToRemoveWallets, setIsNeedToRemoveWallets] = useState(false);

  const [isGeneratingWallets, setIsGeneratingWallets] = useState(false);
  const [isDistributingNative, setIsDistributingNative] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const lastBalanceUpdateRef = useRef<number>(0);
  const balanceFetchInProgressRef = useRef(false);
  const hasLoadedProjectRef = useRef(false); // Add a ref to track if we've loaded the project
  const walletsInUseCountRef = useRef(0);

  // wallet balances
  const [depositWalletBalance, setDepositWalletBalance] = useState<
    number | null
  >(null);

  // selling token after snipe
  const [executingSingleSells, setExecutingSingleSells] = useState<
    Record<string, boolean>
  >({});
  const [executingSingleBuys, setExecutingSingleBuys] = useState<
    Record<string, boolean>
  >({});

  const MIN_BALANCE_UPDATE_INTERVAL = 5000; // Minimum 5 seconds between balance updates
  const MAX_SLIPPAGE_TOLERANCE = 99;
  const PRIORITY_FEE_SETTINGS = {
    normal: 1.0, // Gwei
    medium: 2.0, // Gwei
    high: 5.0, // Gwei
    max: 10.0, // Gwei
    useHigherOnCongestion: true,
  };

  // State from the original component (we'll maintain the same state variables)
  const dispatch = useDispatch<AppDispatch>();
  const { currentProject, loading: isProjectLoading } = useSelector(
    (state: RootState) => state.projects
  );

  const { toast } = useToast();
  const chainId = useChainId();
  const signer = useEthersSigner({ chainId: chainId || 56 });
  const { address } = useAccount();
  const router = useRouter();
  const { disconnect } = useDisconnect();

  const [isAllWalletsSelected, setIsAllWalletsSelected] = useState(false);
  const [isSomeWalletsSelected, setIsSomeWalletsSelected] = useState(false);

  // Add this function after the state declarations
  const handleSelectAllWallets = (checked: boolean) => {
    setWallets((prev) =>
      prev.map((w) => ({
        ...w,
        isSelectedForMutilSell: checked,
      }))
    );
    setIsAllWalletsSelected(checked);
    setIsSomeWalletsSelected(checked);
  };

  // Add this effect to update selection states
  useEffect(() => {
    console.log('useEffect 1');

    const selectedCount = wallets.filter(
      (w) => w.isSelectedForMutilSell
    ).length;
    setIsAllWalletsSelected(
      selectedCount === wallets.length && wallets.length > 0
    );
    setIsSomeWalletsSelected(
      selectedCount > 0 && selectedCount < wallets.length
    );
  }, [wallets]);

  const fetchAndFillDetailedProject = async (projectId: string) => {
    try {
      setIsLoadingProject(true);
      const project = await projectService.getProject(projectId as string);
      setProject(project as ExtendedProject);
    } catch (error: any) {
      console.error('Error fetching project:', error);
      toast({
        title: error.response?.data?.errorType || 'Project Fetch Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to fetch project data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProject(false);
    }
  };

  // Effect to update project when currentProject changes
  useEffect(() => {
    console.log('useEffect 2');
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
            ).map((w: any) => ({
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
    } catch (error: any) {
      console.error('Error converting project:', error);
      toast({
        title: error.response?.data?.errorType || 'Project Conversion Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to convert project data. Please try again.',
        variant: 'destructive',
      });
    }
  }, [currentProject]);

  // Reset to first step when dialog opens and load project if needed
  useEffect(() => {
    console.log('useEffect 3');

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
        fetchAndFillDetailedProject(projectId as string);
        hasLoadedProjectRef.current = true;
      }
    } else {
      // Reset the flag when the dialog closes
      hasLoadedProjectRef.current = false;
    }
  }, [open, projectId]);

  // Effect to fetch deposit wallet balance when on preset configuration step
  useEffect(() => {
    console.log('useEffect 4');

    if (
      currentStep === WizardStep.PRESET_CONFIGURATION &&
      project?.addons?.SnipeBot?.depositWalletId?.publicKey
    ) {
      fetchDepositWalletBalance();
    }
  }, [currentStep, project?.addons?.SnipeBot?.depositWalletId?.publicKey]);

  // Add these imports at the top of the file
  useEffect(() => {
    console.log('useEffect 5');

    // Fetch project bots when project changes
    if (project?._id && project?.addons?.SnipeBot) {
      const depositWalletId = project.addons.SnipeBot.depositWalletId;
      const subWalletIds = project.addons.SnipeBot.subWalletIds || [];

      const newWallets = [depositWalletId, ...subWalletIds];
      setWallets((newWallets as any) || []);
      setWalletCount(String(newWallets.length));

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
    }
  }, [project, address]);

  // Update wallets state when subWalletIds changes
  useEffect(() => {
    console.log('useEffect 6');

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
          nativeFinalInsufficient: 0,
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
          nativeFinalInsufficient: 0,
          nativeSpendRate: 90, // Default to 90% native currency spend rate
        });
      });

      setWallets(newWallets);
      setWalletCount(String(newWallets.length - 1)); // Subtract 1 for the deposit wallet
      // Fetch wallet balances
      const allAddresses = [
        ...(depositWallet ? [depositWallet.publicKey] : []),
        ...subWallets.map((w) => w.publicKey),
      ];
      fetchBalances(allAddresses);
    } else {
      setWallets([]);
      setWalletCount('0');
    }
  }, [
    project?.addons?.SnipeBot?.subWalletIds,
    project?.addons?.SnipeBot?.depositWalletId,
  ]);

  const nativeCurrency =
    project?.chainName === 'BSC_MAINNET'
      ? 'BNB'
      : project?.chainName === 'ETH_MAINNET'
        ? 'ETH'
        : 'SOL';

  // Step navigation functions
  const goToNextStep = () => {
    // If in preset mode, go to PRESET_EXECUTION after PRESET_CONFIGURATION
    if (!isAdvancedMode && currentStep === WizardStep.PRESET_CONFIGURATION) {
      setCurrentStep(WizardStep.PRESET_SELLING_BOARD);
      return;
    }

    if (!isAdvancedMode && currentStep === WizardStep.PRESET_EXECUTION) {
      setCurrentStep(WizardStep.PRESET_SELLING_BOARD);
      return;
    }
    // Skip the preset configuration step if in advanced mode
    if (isAdvancedMode && currentStep === WizardStep.MODE_SELECTION) {
      setCurrentStep(WizardStep.WALLET_SETUP);
      return;
    }

    // Navigate to the normal next step
    if (currentStep < WizardStep.POST_OPERATION) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === WizardStep.POST_OPERATION) {
      // User clicked "Finish" on the final step - just close the modal
      // Success callback is handled in handleApplyPreset when configuration is actually applied
      onOpenChange(false);
    }
  };

  const goToPreviousStep = () => {
    // When in PRESET_EXECUTION step, go back to PRESET_CONFIGURATION
    if (currentStep === WizardStep.PRESET_EXECUTION) {
      setCurrentStep(WizardStep.PRESET_CONFIGURATION);
      return;
    }

    if (currentStep === WizardStep.PRESET_SELLING_BOARD) {
      console.log(
        'going to previous step from preset selling board',
        currentStep
      );

      setCurrentStep(WizardStep.PRESET_CONFIGURATION);
      return;
    }

    // Skip the preset configuration step if in advanced mode and we're at liquidity management
    if (isAdvancedMode && currentStep === WizardStep.WALLET_SETUP) {
      setCurrentStep(WizardStep.MODE_SELECTION);
      return;
    }

    if (currentStep > WizardStep.INTRODUCTION) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleDisconnect = async () => {
    try {
      dispatch(logout());
      disconnect();
    } catch (error) {
      console.error('Error during disconnect:', error);
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
      case WizardStep.PRESET_EXECUTION:
        return renderPresetExecutionStep();
      case WizardStep.PRESET_SELLING_BOARD:
        return renderPostOperationStep();
      case WizardStep.WALLET_SETUP:
        return renderWalletSetupStep();
      case WizardStep.SNIPE_CONFIGURATION:
        return renderSnipeConfigurationStep();
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
            <div className="grid grid-cols-1 sm:grid-cols-2 w-full max-w-md gap-3">
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
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
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

          <div className="mt-6 p-4 bg-amber-50  bg-black:dark border border-amber-200 rounded-md">
            <h4 className="text-amber-800 font-medium">Before you start:</h4>
            <ul className="list-disc pl-6 text-amber-700 mt-2">
              <li>
                Make sure your wallet is connected and has sufficient{' '}
                {nativeCurrency}
              </li>
              <li>Ensure your token contract is properly configured</li>
              <li>Consider the risks involved in token sniping operations</li>
            </ul>
          </div>

          {renderNavigationFooter(false, true, 'Get Started')}
        </div>
      </CardContent>
    </Card>
  );

  const renderWalletSetupStep = () => {
    return (
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
                    {project?.addons.SnipeBot.depositWalletId.publicKey.slice(
                      -4
                    )}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a
                      href={`https://${project?.chainName === 'BSC_MAINNET' ? 'bscscan.com' : project?.chainName === 'ETH_MAINNET' ? 'etherscan.io' : 'solscan.io'}/address/${project?.addons.SnipeBot.depositWalletId.publicKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View on Explorer</span>
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setIsOpenNativeDepositDialog(true)}
                  >
                    Deposit
                  </Button>
                  <Button
                    onClick={() => {
                      const address =
                        project?.addons.SnipeBot.depositWalletId?.publicKey;
                      if (!address) {
                        toast({
                          title: 'Deposit Wallet Not Found',
                          description: 'Please create a deposit wallet first',
                          variant: 'destructive',
                        });
                        return;
                      }
                      fetchBalances([address]);
                    }}
                    className="h-9"
                    variant="outline"
                    disabled={isLoadingBalances}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isLoadingBalances ? 'animate-spin' : ''}`}
                    />
                    {isLoadingBalances ? 'Refreshing...' : 'Refresh Balances'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {nativeCurrency} Balance:
                    </p>
                    <p className="font-medium">
                      {wallets
                        .find((w) => w.role === 'botmain')
                        ?.nativeBalance?.toFixed(4) || '0.0000'}{' '}
                      {nativeCurrency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {project?.symbol} Balance:
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
                    funds. {nativeCurrency} from this wallet will be distributed
                    to your sniping wallets.
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
                    }}
                    min="1"
                    max="50"
                  />
                </div>

                <Button
                  onClick={async () => {
                    if (wallets.length - 1 > parseInt(walletCount)) {
                      setIsNeedToRemoveWallets(true);
                    } else {
                      try {
                        await handleGenerateWallets(parseInt(walletCount));
                      } catch (error: any) {
                        console.error(
                          'OnClick generating wallets error:',
                          error
                        );
                        toast({
                          title:
                            error.response?.data?.errorType ||
                            'Generating wallets Error',
                          description:
                            error.response?.data?.errorMessage ||
                            'Generating wallets failed. Please try again.',
                          variant: 'destructive',
                        });
                      }
                    }
                  }}
                  disabled={isProjectLoading || isGeneratingWallets}
                  className="h-8"
                  size="sm"
                >
                  {project?.addons?.SnipeBot?.subWalletIds?.length
                    ? 'Update Wallets'
                    : 'Create Wallets'}
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
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isLoadingBalances ? 'animate-spin' : ''}`}
                  />
                  {isLoadingBalances ? 'Refreshing...' : 'Refresh Balances'}
                </Button>
              </div>

              {isNeedToRemoveWallets && (
                <div className="my-4 p-4 border border-amber-200 rounded-md">
                  <h4 className="text-amber-800 font-medium">Warning:</h4>
                  <ul className="list-disc pl-6 text-amber-700 mt-2">
                    <li>
                      You have {wallets.length - 1} wallets now but you are
                      going to use {walletCount} wallets for this preset.
                    </li>
                    <li>The rest wallets will be removed from the project.</li>
                    <li className="text-red-700 font-bold">
                      Make sure that you have already collected all native
                      currency and tokens from them.
                    </li>
                  </ul>

                  <div className="flex justify-center items-center gap-4 mt-4">
                    <Button
                      className="w-full sm:w-fit"
                      onClick={async () => {
                        setIsNeedToRemoveWallets(false);
                        await handleGenerateWallets(parseInt(walletCount));
                      }}
                    >
                      Yes, I have done
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:w-fit"
                      onClick={() => setIsNeedToRemoveWallets(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground mb-4">
                You can create up to 50 sniping wallets. Each wallet will be
                used to snipe tokens during execution.
              </div>

              {/* Wallets Table */}
              <div className="overflow-x-auto border rounded-lg max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[10%]">No</TableHead>
                      <TableHead className="w-[200px]">Wallets</TableHead>
                      <TableHead className=" text-right">
                        {nativeCurrency}
                      </TableHead>
                      <TableHead className=" text-right">
                        Buying Tokens
                      </TableHead>
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
                            {(wallet.nativeBalance || 0).toFixed(4)}
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

            {/* Help Section */}
            <div className="bg-muted/20 rounded-lg p-4">
              <h3 className="text-base font-medium mb-2">How it works</h3>
              <ol className="list-decimal ml-5 space-y-2 text-sm">
                <li>
                  Create multiple sniping wallets to distribute your sniping
                  operation
                </li>
                <li>
                  Later, you'll distribute {nativeCurrency} from your deposit
                  wallet to these sniping wallets
                </li>
                <li>
                  During the sniping operation, each wallet will buy tokens
                  independently
                </li>
                <li>
                  Using multiple wallets helps avoid large price impacts and
                  makes your operation more stealthy
                </li>
              </ol>
            </div>
          </div>
          {renderNavigationFooter()}
        </CardContent>
      </Card>
    );
  };

  const renderSnipeConfigurationStep = () => (
    <Card className="border-none shadow-none ">
      <CardHeader className=" p-4 p-4 sm:p-6">
        <CardTitle>Snipe Configuration</CardTitle>
        <CardDescription>
          {isAdvancedMode
            ? 'Configure detailed parameters for your token snipe operation.'
            : 'Configure how much of the token you want to snipe and distribute amounts across your wallets.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 p-4 sm:px-6">
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
                      {poolInfo?.nativeReserve?.toFixed(4) || '0'}{' '}
                      {nativeCurrency}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Show the mode-specific UI */}
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
                  <div
                    key={index}
                    className={`border rounded-md p-3 cursor-pointer transition-all ${
                      phase.isSelected
                        ? 'border-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => {
                      if (
                        !project?.isImported ||
                        (phase.name !== 'TGE Snipe' &&
                          phase.name !== 'Post-Launch')
                      ) {
                        const newPhases = advancedConfig.snipePhases.map(
                          (p, i) => ({
                            ...p,
                            isSelected: i === index,
                          })
                        );
                        setAdvancedConfig({
                          ...advancedConfig,
                          snipePhases: newPhases,
                        });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={phase.isSelected}
                            onChange={() => {}}
                            className="h-4 w-4"
                            disabled={
                              (phase.name === 'TGE Snipe' ||
                                phase.name === 'Post-Launch') &&
                              project?.isImported
                            }
                          />
                          <span>{phase.name}</span>
                        </div>
                        {(phase.name === 'TGE Snipe' ||
                          phase.name === 'Post-Launch') &&
                          project?.isImported && (
                            <span className="text-xs text-destructive ml-4">
                              This phase is not available for imported projects
                            </span>
                          )}
                      </div>
                      {advancedConfig.snipePhases.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdvancedConfig({
                              ...advancedConfig,
                              snipePhases: advancedConfig.snipePhases.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                          disabled={
                            (phase.name === 'TGE Snipe' ||
                              phase.name === 'Post-Launch') &&
                            project?.isImported
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                      {/* Allocation Section - 50% width */}
                      <div className="flex flex-col">
                        <Label
                          htmlFor={`phase-${index}-percentage`}
                          className="text-xs mb-1"
                        >
                          Allocation:
                        </Label>
                        <div className="flex items-center">
                          <Input
                            id={`phase-${index}-percentage`}
                            value={phase.percentage}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newPhases = [...advancedConfig.snipePhases];
                              newPhases[index].percentage = Number(
                                e.target.value
                              );
                              setAdvancedConfig({
                                ...advancedConfig,
                                snipePhases: newPhases,
                              });
                            }}
                            className="h-7 w-full mr-1"
                            type="number"
                            min="0"
                            max="100"
                            disabled={
                              (phase.name === 'TGE Snipe' ||
                                phase.name === 'Post-Launch') &&
                              project?.isImported
                            }
                          />
                          <span className="text-xs">%</span>
                        </div>
                      </div>

                      {/* Priority Fee Section - 50% width */}
                      <div className="flex flex-col">
                        <Label
                          htmlFor={`phase-${index}-priority`}
                          className="text-xs mb-1"
                        >
                          Priority Fee:
                        </Label>
                        <select
                          id={`phase-${index}-priority`}
                          value={phase.priorityFee}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newPhases = [...advancedConfig.snipePhases];
                            newPhases[index].priorityFee = e.target.value;
                            setAdvancedConfig({
                              ...advancedConfig,
                              snipePhases: newPhases,
                            });
                          }}
                          className="w-full h-8 rounded-md border px-3 text-sm"
                          disabled={
                            (phase.name === 'TGE Snipe' ||
                              phase.name === 'Post-Launch') &&
                            project?.isImported
                          }
                        >
                          <option className="w-[200px] text-xs" value="low">
                            Low ({PRIORITY_FEE_SETTINGS.normal} Gwei)
                          </option>
                          <option className="w-[200px] text-xs" value="medium">
                            Medium ({PRIORITY_FEE_SETTINGS.medium} Gwei)
                          </option>
                          <option className="w-[200px] text-xs" value="high">
                            High ({PRIORITY_FEE_SETTINGS.high} Gwei)
                          </option>
                          <option className="w-[200px] text-xs" value="max">
                            Maximum ({PRIORITY_FEE_SETTINGS.max} Gwei)
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {/* <div className="flex sm:justify-end w-full sm:w-fit ">
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
                              isSelected: false,
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
                </div> */}
              </div>
            </div>

            {/* Timing & Stealth Configuration */}
            {/* <div className="border rounded-lg p-4">
              <h3 className="text-base font-medium mb-3">
                Timing & Stealth Options
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Timing Configuration</h4>

                  <div>
                    <Label htmlFor="wait-blocks" className="text-xs mb-1 block">
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

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Stealth Configuration</h4>

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
            </div> */}
          </>

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

          {/* Distribution Mode Selection */}
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                checked={distributionMode === 'random'}
                onChange={() => setDistributionMode('random')}
              />
              Random
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                checked={distributionMode === 'manual'}
                onChange={() => setDistributionMode('manual')}
              />
              Manual
            </label>
          </div>

          {/* Calculate Token Amounts Button */}
          <div className="flex justify-center sm:justify-end gap-2">
            <Button
              className="w-full sm:w-fit"
              onClick={() => {
                if (!poolInfo) {
                  toast({
                    title: 'Error',
                    description: 'Pool information not available',
                    variant: 'destructive',
                  });
                  return;
                }
                const walletList = wallets.filter((w) => w.role !== 'botmain');
                // Calculate total tokens to distribute based on sum of all phase allocations
                const totalPhasePercent = advancedConfig.snipePhases
                  .filter((phase) => phase.isSelected)
                  .reduce((sum, phase) => sum + Number(phase.percentage), 0);

                console.log(
                  '==========totalPhasePercent=========',
                  totalPhasePercent
                );
                const totalTokens =
                  poolInfo.tokenReserve * (totalPhasePercent / 100);
                if (distributionMode === 'random') {
                  // Randomly assign percentages that sum to 100 and are different 20% from each other
                  const remaining = 100;
                  const walletCount = walletList.length;
                  const base = Math.floor(remaining / walletCount);
                  const minDelta = -Math.floor(base * 0.2); // max 10% below base
                  const maxDelta = Math.floor(base * 0.2); // max 10% above base

                  const tempPercents: number[] = [];
                  for (let i = 0; i < walletCount; i++) {
                    const delta =
                      Math.floor(Math.random() * (maxDelta - minDelta + 1)) +
                      minDelta;
                    const percent = base + delta;
                    tempPercents.push(percent);
                  }

                  // Adjust to ensure total is 100%
                  const sum = tempPercents.reduce((a, b) => a + b, 0);
                  const diff = 100 - sum;

                  // Apply adjustment to one random index
                  tempPercents[0] += diff;

                  const randomPercents: { [address: string]: number } = {};
                  walletList.forEach((wallet, i) => {
                    randomPercents[wallet.publicKey] = tempPercents[i];
                  });

                  setWalletPercents(randomPercents);

                  setWallets((prevWallets) =>
                    prevWallets.map((wallet) => ({
                      ...wallet,
                      tokenAmount: Math.floor(
                        (totalTokens *
                          (randomPercents[wallet.publicKey] || 0)) /
                          100
                      ),
                    }))
                  );
                  toast({
                    title: 'Success',
                    description: 'Random distribution calculated.',
                  });
                } else {
                  // Manual mode
                  const sum = Object.values(walletPercents).reduce(
                    (a, b) => a + Number(b),
                    0
                  );
                  if (sum !== 100) {
                    toast({
                      title: 'Error',
                      description: 'Total percent must be 100%',
                      variant: 'destructive',
                    });
                    return;
                  }
                  setWallets((prevWallets) =>
                    prevWallets.map((wallet) => ({
                      ...wallet,
                      tokenAmount: Math.floor(
                        (totalTokens *
                          (walletPercents[wallet.publicKey] || 0)) /
                          100
                      ),
                    }))
                  );
                  toast({
                    title: 'Success',
                    description: 'Manual distribution applied.',
                  });
                }
              }}
              disabled={
                !poolInfo ||
                !wallets.length ||
                wallets.filter((w) => w.role !== 'botmain').length === 0 ||
                (distributionMode === 'manual' &&
                  Object.values(walletPercents).reduce(
                    (a, b) => a + Number(b),
                    0
                  ) !== 100)
              }
            >
              Calculate Token Amounts
            </Button>

            <Button
              className={`bg-green-500 hover:bg-green-600 w-full sm:w-fit `}
              onClick={async () => {
                try {
                  await handleAllInOneSnipe();
                } catch (error: any) {
                  console.error(
                    'Onclick Error executing all in one snipe:',
                    error
                  );
                  if (error.response?.data?.errorType.includes('jwt')) {
                    handleDisconnect();
                    router.push('/');
                  } else if (
                    error.response?.data?.errorType.includes('insufficient') ||
                    error.message.includes('estimate fees')
                  ) {
                    toast({
                      title: 'Sniping Error',
                      description:
                        error.response?.data?.error ||
                        error.response?.data?.errorMessage ||
                        `You don't have enough ${nativeCurrency} to execute the snipe. Please add more ${nativeCurrency} to your deposit wallet.`,
                      variant: 'destructive',
                    });
                  } else {
                    console.log('[new tracking transactions]', error.response);
                    toast({
                      title: 'Error',
                      description:
                        error.response?.data?.error ||
                        error.response?.data?.errorMessage ||
                        'An error occurred while executing all in one snipe',
                      variant: 'destructive',
                    });
                  }
                }
              }}
              disabled={
                isExecuting ||
                wallets.filter(
                  (w) =>
                    w.role !== 'botmain' &&
                    (w.tokenAmount === 0 || !w.tokenAmount)
                ).length !== 0
              }
            >
              {isExecuting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Executing Snipe...
                </>
              ) : (
                `Execute Snipe`
              )}
            </Button>
          </div>

          {/* Token Distribution Table */}
          {wallets.filter((w) => w.role !== 'botmain').length > 0 && (
            <div className="border rounded-lg p-2 sm:p-4 mt-4">
              <h3 className="text-base font-medium mb-2 sm:mb-3">
                Token Distribution
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[8%]">No</TableHead>
                      <TableHead className="w-[20%]">Wallet</TableHead>
                      <TableHead className="text-right">Percent</TableHead>
                      <TableHead className="text-right">Token Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets
                      .filter((w) => w.role !== 'botmain')
                      .map((wallet, index) => (
                        <TableRow key={wallet.publicKey}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {wallet.publicKey.slice(0, 6)}...
                            {wallet.publicKey.slice(-4)}
                          </TableCell>
                          <TableCell className="text-right flex items-center justify-end">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              value={walletPercents[wallet.publicKey] ?? ''}
                              disabled={distributionMode === 'random'}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setWalletPercents((prev) => ({
                                  ...prev,
                                  [wallet.publicKey]: value,
                                }));
                              }}
                              className="w-20 text-right place-self-end ml-auto"
                            />
                            <span className="ml-1">%</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {wallet.tokenAmount?.toLocaleString() || '0'}
                          </TableCell>
                        </TableRow>
                      ))}
                    <TableRow className="bg-muted/20 font-medium">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">
                        {Object.values(walletPercents)
                          .reduce((sum, v) => sum + (Number(v) || 0), 0)
                          .toFixed(2)}
                        %
                      </TableCell>
                      <TableCell className="text-right">
                        {wallets
                          .filter((w) => w.role !== 'botmain')
                          .reduce((sum, w) => sum + (w.tokenAmount || 0), 0)
                          .toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        {renderNavigationFooter()}
      </CardContent>
    </Card>
  );

  const renderPostOperationStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader className=" p-4 sm:p-6">
        <CardTitle>Post-Operation Management</CardTitle>
        <CardDescription>
          Sell tokens and collect {nativeCurrency} after successful sniping.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Wallet Management Section */}
          <div className="border rounded-lg p-4 sm:p-6 w-full">
            <h3 className="text-base font-medium mb-2 sm:mb-3">
              Wallet Management
            </h3>
            <p className="text-sm text-muted-foreground mb-2 sm:mb-4">
              Manage your wallets, sell tokens, and collect {nativeCurrency}.
            </p>
            {/* Deposit Wallet Balance */}
            <div className="border rounded-lg p-4 sm:p-6 bg-muted/10 mb-2">
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
                    {nativeCurrency} Balance:
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {isLoadingDepositWalletBalance
                        ? 'Loading...'
                        : depositWalletBalance !== null
                          ? `${depositWalletBalance.toFixed(4)} ${nativeCurrency}`
                          : `0.0000 ${nativeCurrency}`}
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

            {/* Extra {nativeCurrency} Distribution */}
            <div className="border rounded-lg p-4">
              <h3 className="text-base font-medium mb-3">
                Distribute Extra {nativeCurrency} (Recommended)
              </h3>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor="extraDistributeNativeAmount"
                    className="whitespace-nowrap"
                  >
                    Amount per wallet:
                  </Label>
                  <Input
                    id="extraDistributeNativeAmount"
                    type="number"
                    value={extraDistributeNativeAmount}
                    onChange={(e) =>
                      setExtraDistributeNativeAmount(Number(e.target.value))
                    }
                    step="0.01"
                    min="0"
                    className="max-w-32"
                  />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-fit">
                  <span className="text-sm">{nativeCurrency}</span>
                  <Button
                    className="bg-green-500 hover:bg-green-600 w-full sm:w-fit"
                    onClick={async () => {
                      try {
                        await handleDistributeExtraNative();
                      } catch (error: any) {
                        console.error(
                          `Onclick Error distributing extra ${nativeCurrency}:`,
                          error
                        );
                        if (error.response?.data?.errorType.includes('jwt')) {
                          handleDisconnect();
                          router.push('/');
                        }
                      }
                    }}
                    disabled={
                      !wallets.filter(
                        (wallet: WalletInfo) => wallet.role !== 'botmain'
                      ).length || isDistributingNative
                    }
                  >
                    {isDistributingNative
                      ? 'Distributing...'
                      : `Distribute Extra ${nativeCurrency}`}
                  </Button>
                </div>
              </div>

              <div className="border border-green-400 rounded-md p-3 mt-4 text-green-700 text-sm">
                <p>
                  💡 This is useful for providing {nativeCurrency} to wallets
                  for sell/buy operations
                </p>
              </div>
            </div>

            {/* Wallet Table */}
            {/* <div className="relative h-[320px] overflow-y-auto">
              <div className="border rounded-lg w-full absolute"> */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">
                    <Checkbox
                      checked={isAllWalletsSelected}
                      onCheckedChange={handleSelectAllWallets}
                      data-state={
                        isSomeWalletsSelected && !isAllWalletsSelected
                          ? 'indeterminate'
                          : isAllWalletsSelected
                            ? 'checked'
                            : 'unchecked'
                      }
                      disabled={isLoadingBalances}
                    />
                  </TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">{nativeCurrency}</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-center">Sell %</TableHead>
                  <TableHead className="text-center">
                    {nativeCurrency} Rate for buying %
                  </TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.length > 0 ? (
                  wallets
                    .filter((w) => w.role !== 'botmain')
                    .map((wallet, _index) => (
                      <TableRow key={wallet.publicKey}>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={
                              (wallet.tokenBalance || 0) <= 0 &&
                              (wallet.nativeBalance || 0) <= 0
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
                              (wallet.nativeBalance || 0) <= 0
                            }
                          />
                        </TableCell>
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
                              onClick={() => copyToClipboard(wallet.publicKey)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                window.open(
                                  `https://${project?.chainName === 'BSC_MAINNET' ? 'bscscan.com' : project?.chainName === 'ETH_MAINNET' ? 'etherscan.io' : 'solscan.io'}/address/${wallet.publicKey}`,
                                  '_blank'
                                )
                              }
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {wallet.nativeBalance?.toFixed(4) || '0.000000'}
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
                                        sellPercentage: Number(e.target.value),
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
                              wallet.nativeSpendRate === undefined
                                ? 50
                                : wallet.nativeSpendRate
                            }
                            onChange={(e) =>
                              setWallets((prev) =>
                                prev.map((w) =>
                                  w.publicKey === wallet.publicKey
                                    ? {
                                        ...w,
                                        nativeSpendRate: Number(e.target.value),
                                      }
                                    : w
                                )
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-row gap-2 justify-center">
                            <Button
                              className="h-8"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await handleSingleBuy(wallet.publicKey);
                                } catch (error: any) {
                                  console.error(
                                    'Onclick Error single-buying:',
                                    error
                                  );
                                  if (
                                    error.response?.data?.errorType.includes(
                                      'jwt'
                                    )
                                  ) {
                                    handleDisconnect();
                                    router.push('/');
                                  }
                                }
                              }}
                              disabled={
                                executingSingleBuys[wallet.publicKey] ||
                                wallet.isSelectedForMutilSell ||
                                (wallet.nativeBalance || 0) <= 0
                              }
                            >
                              {executingSingleBuys[wallet.publicKey] ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Buy
                            </Button>
                            <Button
                              className="h-8"
                              onClick={async () => {
                                try {
                                  await handleSingleSell(
                                    wallet.publicKey,
                                    wallet.sellPercentage || 100
                                  );
                                } catch (error: any) {
                                  console.error(
                                    'Onclick Error single-selling:',
                                    error
                                  );
                                  if (
                                    error.response?.data?.errorType.includes(
                                      'jwt'
                                    )
                                  ) {
                                    handleDisconnect();
                                    router.push('/');
                                  }
                                }
                              }}
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
            {/* </div>
            </div> */}

            {/* Action Buttons */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                onClick={() => {
                  const addresses = wallets.map((w) => w.publicKey);
                  fetchBalances(addresses);
                }}
                className="h-9"
                variant="default"
                disabled={isLoadingBalances}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoadingBalances ? 'animate-spin' : ''}`}
                />
                {isLoadingBalances ? 'Refreshing...' : 'Refresh Balances'}
              </Button>

              <Button
                onClick={async () => {
                  try {
                    await handleCollectNative();
                  } catch (error: any) {
                    console.error('Onclick Error collecting:', error);
                    if (error.response?.data?.errorType.includes('jwt')) {
                      handleDisconnect();
                      router.push('/');
                    }
                  }
                }}
                className="h-9"
                variant="default"
                disabled={
                  isCollectingNative ||
                  isExecutingMultiSell ||
                  !wallets.some(
                    (w) =>
                      w.role !== 'botmain' && (w.nativeBalance || 0) > 0.00001
                  )
                }
              >
                {isCollectingNative ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Collect {nativeCurrency}
              </Button>

              {/* <Button
                onClick={() => {
                  try {
                    handleDownloadWalletInfo();
                  } catch (error: any) {
                    console.error(
                      'Onclick Error downloading wallet info:',
                      error
                    );
                    if (error.response?.data?.errorType.includes('jwt')) {
                      handleDisconnect();
                      router.push('/');
                    }
                  }
                }}
                className="h-9"
                variant="default"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Table
              </Button> */}

              <Button
                onClick={async () => {
                  try {
                    await handleMultiSell();
                  } catch (error: any) {
                    console.error('Onclick Error multi-selling:', error);
                    if (error.response?.data?.errorType.includes('jwt')) {
                      handleDisconnect();
                      router.push('/');
                    } else {
                      toast({
                        title:
                          error.response?.data?.errorType || 'Multi-sell error',
                        description:
                          error.response?.data?.errorMessage
                            ?.toString()
                            .slice(0, 200) || 'An unknown error occurred',
                        variant: 'destructive',
                      });
                    }
                  }
                }}
                disabled={
                  isExecutingMultiSell ||
                  isCollectingNative ||
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
                onClick={async () => {
                  try {
                    await handleMultiBuy();
                  } catch (error: any) {
                    console.error('Onclick Error multi-buying:', error);
                    if (error.response?.data?.errorType.includes('jwt')) {
                      handleDisconnect();
                      router.push('/');
                    } else {
                      toast({
                        title:
                          error.response?.data?.errorType || 'Multi-buy error',
                        description:
                          error.response?.data?.errorMessage
                            ?.toString()
                            .slice(0, 200) || 'An unknown error occurred',
                        variant: 'destructive',
                      });
                    }
                  }
                }}
                disabled={
                  isExecutingMultiBuy ||
                  isCollectingNative ||
                  !wallets.some(
                    (w) =>
                      w.isSelectedForMutilSell &&
                      w.role !== 'botmain' &&
                      (w.nativeBalance || 0) > 0
                  )
                }
                className="h-9"
                variant="default"
              >
                {isExecutingMultiBuy ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Multi Buy {project?.symbol || project?.name}
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
                  Refresh balances to see the current token and {nativeCurrency}{' '}
                  amounts
                </li>
                <li>Use "Buy" to purchase tokens from individual wallets</li>
                <li>Set the sell percentage for each wallet (default: 100%)</li>
                <li>Use "Single Sell" to sell from individual wallets</li>
                <li>
                  Check wallets and use "Multi Sell" to sell from multiple
                  wallets at once
                </li>
                <li>
                  After selling, use "Collect {nativeCurrency}" to transfer{' '}
                  {nativeCurrency} to your deposit wallet
                </li>
                <li>
                  If there's insufficient {nativeCurrency} in any wallet, use
                  "Distribute
                  {nativeCurrency}" to transfer {nativeCurrency} from the
                  deposit wallet to the sniping wallets
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
                    Total {nativeCurrency} Balance:
                  </span>{' '}
                  {wallets
                    .reduce((sum, w) => sum + (w.nativeBalance || 0), 0)
                    .toFixed(6)}{' '}
                  {nativeCurrency}
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
                    snipeAmount: 60,
                    snipeAmountUnit: 'percentage',
                    walletCount: 30,
                    maxSlippage: 3,
                    timeFrame: 'only at TGE block',
                  });
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
                    snipeAmount: 10,
                    snipeAmountUnit: 'percentage',
                    stageCount: 1,
                    stageMinWalletCount: 3,
                    stageMaxWalletCount: 5,
                    stageTimeDelta: 'medium',
                    timeFrame: 'within first 30 minutes of launch',
                  });
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
                    snipeAmount: 1000,
                    snipeAmountUnit: 'percentage',
                    walletCount: 5,
                    timeFrame: 'ASAP',
                    priceThreshold: 0.001,
                    priceThresholdUnit: 'USD',
                    expirationTime: 86400,
                  });
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
                      <Label htmlFor="snipeAmount">Target Amount:</Label>
                      <div className="flex items-center gap-2">
                        {presetConfig.snipeAmountUnit === 'percentage' ? (
                          <>
                            <div className="w-24">
                              <Input
                                id="snipeAmount"
                                type="number"
                                value={presetConfig.snipeAmount}
                                onChange={(e) =>
                                  setPresetConfig({
                                    ...presetConfig,
                                    snipeAmount: Number(e.target.value),
                                  })
                                }
                                className="h-8"
                                min="1"
                                max="100"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="w-24">
                            <Input
                              id="snipeAmount"
                              type="number"
                              value={presetConfig.snipeAmount || 0}
                              onChange={(e) =>
                                setPresetConfig({
                                  ...presetConfig,
                                  snipeAmount: Number(e.target.value),
                                })
                              }
                              className="h-8"
                              min="1"
                              placeholder="Token amount"
                            />
                          </div>
                        )}
                        <Select
                          value={presetConfig.snipeAmountUnit}
                          onValueChange={(value) =>
                            setPresetConfig({
                              ...presetConfig,
                              snipeAmountUnit: value,
                            })
                          }
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
                    {presetConfig.snipeAmountUnit === 'percentage' && (
                      <Slider
                        defaultValue={[30]}
                        min={1}
                        max={100}
                        step={1}
                        value={[presetConfig.snipeAmount || 30]}
                        onValueChange={(values) =>
                          setPresetConfig({
                            ...presetConfig,
                            snipeAmount: values[0],
                          })
                        }
                      />
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {presetConfig.snipeAmountUnit === 'percentage'
                        ? `Aim for up to ${presetConfig.snipeAmount}% of tokens in the pool at launch`
                        : `Aim to buy ${presetConfig.snipeAmount?.toLocaleString() || 0} tokens at launch`}
                    </div>
                  </div>

                  {/* Number of Wallets */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="walletCount">Number of Wallets:</Label>
                      <div className="w-24">
                        <Input
                          id="walletCount"
                          type="number"
                          value={presetConfig.walletCount}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              walletCount: Number(e.target.value),
                            })
                          }
                          className="h-8"
                          min="1"
                          max="50"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Distribute rapid snipe across {presetConfig.walletCount}{' '}
                      wallets for higher chance of success
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
                      <Label htmlFor="snipeAmount">Target Amount:</Label>
                      <div className="flex items-center gap-2">
                        {presetConfig.snipeAmountUnit === 'percentage' ? (
                          <>
                            <div className="w-24">
                              <Input
                                id="snipeAmount"
                                type="number"
                                value={presetConfig.snipeAmount}
                                onChange={(e) =>
                                  setPresetConfig({
                                    ...presetConfig,
                                    snipeAmount: Number(e.target.value),
                                  })
                                }
                                className="h-8"
                                min="1"
                                max="100"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="w-24">
                            <Input
                              id="totalTokenAmount"
                              type="number"
                              value={presetConfig.snipeAmount || 0}
                              onChange={(e) =>
                                setPresetConfig({
                                  ...presetConfig,
                                  snipeAmount: Number(e.target.value),
                                })
                              }
                              className="h-8"
                              min="1"
                              placeholder="Token amount"
                            />
                          </div>
                        )}
                        <Select
                          value={presetConfig.snipeAmountUnit}
                          onValueChange={(value) =>
                            setPresetConfig({
                              ...presetConfig,
                              snipeAmountUnit: value,
                            })
                          }
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
                    {presetConfig.snipeAmountUnit === 'percentage' && (
                      <Slider
                        defaultValue={[70]}
                        min={1}
                        max={100}
                        step={1}
                        value={[presetConfig.snipeAmount || 70]}
                        onValueChange={(values) =>
                          setPresetConfig({
                            ...presetConfig,
                            snipeAmount: values[0],
                          })
                        }
                      />
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {presetConfig.snipeAmountUnit === 'percentage'
                        ? `Total target share of ${presetConfig.snipeAmount}% to accumulate across all buy stages`
                        : `Total token amount of ${presetConfig.snipeAmount?.toLocaleString() || 0} to accumulate across all buy stages`}
                    </div>
                  </div>

                  {/* Buy Stage Counts */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="stageCount">Number of Buy Stages:</Label>
                      <div className="w-24">
                        <Input
                          id="stageCount"
                          type="number"
                          value={presetConfig.stageCount}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              stageCount: Number(e.target.value),
                            })
                          }
                          className="h-8"
                          min="1"
                          max="10"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Split your buys into {presetConfig.stageCount} stages to
                      avoid large price impact
                    </div>
                  </div>

                  {/* Wallet Range */}
                  <div>
                    <Label htmlFor="walletRange" className="mb-2 block">
                      Wallets Per Stage:
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label
                          htmlFor="stageMinWalletCount"
                          className="text-xs"
                        >
                          Min:
                        </Label>
                        <Input
                          id="stageMinWalletCount"
                          type="number"
                          value={presetConfig.stageMinWalletCount}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              stageMinWalletCount: Number(e.target.value),
                            })
                          }
                          className="h-8"
                          min="1"
                          max={presetConfig.stageMaxWalletCount || 20}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="stageMaxWalletCount"
                          className="text-xs"
                        >
                          Max:
                        </Label>
                        <Input
                          id="stageMaxWalletCount"
                          type="number"
                          value={presetConfig.stageMaxWalletCount}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              stageMaxWalletCount: Number(e.target.value),
                            })
                          }
                          className="h-8"
                          min={presetConfig.stageMinWalletCount || 1}
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
                    <Label htmlFor="stageTimeDelta" className="mb-2 block">
                      Time Between Buys:
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Button
                        variant={
                          presetConfig.stageTimeDelta === 'very short'
                            ? 'default'
                            : 'outline'
                        }
                        className="h-auto py-2"
                        onClick={() =>
                          setPresetConfig({
                            ...presetConfig,
                            stageTimeDelta: 'very short',
                          })
                        }
                      >
                        Very Short (30s)
                      </Button>
                      <Button
                        variant={
                          presetConfig.stageTimeDelta === 'medium'
                            ? 'default'
                            : 'outline'
                        }
                        className="h-auto py-2"
                        onClick={() =>
                          setPresetConfig({
                            ...presetConfig,
                            stageTimeDelta: 'medium',
                          })
                        }
                      >
                        Medium (2-5 min)
                      </Button>
                      <Button
                        variant={
                          presetConfig.stageTimeDelta === 'long'
                            ? 'default'
                            : 'outline'
                        }
                        className="h-auto py-2"
                        onClick={() =>
                          setPresetConfig({
                            ...presetConfig,
                            stageTimeDelta: 'long',
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
                          max={
                            presetConfig.priceThresholdUnit === nativeCurrency
                              ? '1'
                              : '1000'
                          }
                          step="0.000001"
                        />
                        <span className="text-xs text-muted-foreground">
                          USD
                        </span>
                        {/* <Select
                          value={presetConfig.priceThresholdUnit}
                          onValueChange={(value) => setPriceThresholdUnit(value)}
                        >
                          <SelectTrigger className="h-8 w-16">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={nativeCurrency}>{nativeCurrency}</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select> */}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only buy if token price is below this threshold
                    </p>
                  </div>

                  {/* Target Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="snipeAmount">Target Amount:</Label>
                      <div className="flex items-center w-36">
                        <Input
                          id="snipeAmount"
                          type="number"
                          value={presetConfig.snipeAmount}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              snipeAmount: Number(e.target.value),
                            })
                          }
                          className="h-8"
                          min="1"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total token amount to buy across all wallets
                    </p>
                  </div>

                  {/* Number of Wallets */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="walletCount">Number of Wallets:</Label>
                      <div className="flex items-center w-36">
                        <Input
                          id="walletCount"
                          type="number"
                          value={presetConfig.walletCount}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              walletCount: Number(e.target.value),
                            })
                          }
                          className="h-8"
                          min="1"
                          max="20"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Distribute buys across multiple wallets for stealth
                    </p>
                  </div>

                  {/* Max Slippage */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="maxSlippage">Max Slippage (%):</Label>
                      <div className="flex items-center w-36">
                        <Input
                          id="maxSlippage"
                          type="number"
                          value={presetConfig.maxSlippage}
                          onChange={(e) =>
                            setPresetConfig({
                              ...presetConfig,
                              maxSlippage: Number(e.target.value),
                            })
                          }
                          className="h-8"
                          min="0.1"
                          max="50"
                          step="0.1"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maximum acceptable slippage percentage
                    </p>
                  </div>

                  {/* Expiration Time (optional enhancement) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="expirationTime">Expiration Time:</Label>
                      <div className="flex items-center w-36">
                        <Select
                          value={String(presetConfig.expirationTime || '86400')}
                          onValueChange={(value) =>
                            setPresetConfig({
                              ...presetConfig,
                              expirationTime: Number(value),
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3600">1 hour</SelectItem>
                            <SelectItem value="43200">12 hours</SelectItem>
                            <SelectItem value="86400">24 hours</SelectItem>
                            <SelectItem value="172800">48 hours</SelectItem>
                            <SelectItem value="345600">7 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cancel the passive buy if not executed within this time
                    </p>
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
                      {nativeCurrency} Balance:
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {isLoadingDepositWalletBalance
                          ? 'Loading...'
                          : depositWalletBalance !== null
                            ? `${depositWalletBalance.toFixed(4)} ${nativeCurrency}`
                            : `0.0000 ${nativeCurrency}`}
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
                    onClick={() => setIsOpenNativeDepositDialog(true)}
                  >
                    Deposit
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  This wallet will be used to distribute {nativeCurrency} to
                  sniping wallets and pay transaction fees.
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No deposit wallet is configured for this project.
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border rounded-lg p-4 bg-muted/10 flex sm:flex-row flex-col justify-between sm:items-center gap-4">
            <div className="">
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
                      <span className="text-muted-foreground">
                        Target Share:
                      </span>{' '}
                      Up to {presetConfig.snipeAmount}% of tokens in the pool
                    </p>
                    <p>
                      <span className="text-muted-foreground">Wallets:</span>{' '}
                      {presetConfig.walletCount} sniping wallets
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
                      <span className="text-muted-foreground">
                        Total Share:
                      </span>{' '}
                      Up to {presetConfig.snipeAmount}% of tokens in the pool
                    </p>
                    <p>
                      <span className="text-muted-foreground">Buy Stages:</span>{' '}
                      {presetConfig.stageCount} stages
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Wallets Per Stage:
                      </span>{' '}
                      {presetConfig.stageMinWalletCount} to{' '}
                      {presetConfig.stageMaxWalletCount} wallets
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Time Between Buys:
                      </span>{' '}
                      {presetConfig.stageTimeDelta === 'very short'
                        ? 'Very Short (30s)'
                        : presetConfig.stageTimeDelta === 'medium'
                          ? 'Medium (2-5 min)'
                          : 'Long (15+ min)'}
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Max Slippage:
                      </span>{' '}
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
                      {presetConfig.priceThreshold} USD
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Target Amount:
                      </span>{' '}
                      {presetConfig.snipeAmount?.toLocaleString()} tokens
                    </p>
                    <p>
                      <span className="text-muted-foreground">Wallets:</span>{' '}
                      {presetConfig.walletCount} wallets
                    </p>

                    <p>
                      <span className="text-muted-foreground">
                        Max Slippage:
                      </span>{' '}
                      {presetConfig.maxSlippage}%
                    </p>
                  </>
                )}
              </div>
            </div>

            <div>
              <Button className="w-full sm:w-fit" onClick={handleApplyPreset}>
                Apply Preset
              </Button>
            </div>
          </div>

          {isNeedToRemoveWallets && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <h4 className="text-amber-800 font-medium">Warning:</h4>
              <ul className="list-disc pl-6 text-amber-700 mt-2">
                <li>
                  You have {wallets.length - 1} wallets now but you are going to
                  use {walletCount} wallets for this preset.
                </li>
                <li>The rest wallets will be removed from the project.</li>
                <li className="text-red-700 font-bold">
                  Make sure that you have already collected all native currency
                  and tokens from them.
                </li>
              </ul>

              <div className="flex justify-center items-center gap-4 mt-4">
                <Button
                  className="w-full sm:w-fit"
                  onClick={async () => {
                    if (presetConfig.strategy === PresetStrategy.RAPID_SNIPE) {
                      console.log('RAPID_SNIPE');
                      // execute the preset
                      try {
                        setIsPresetExecuting(true);
                        setCurrentStep(WizardStep.PRESET_EXECUTION);

                        const originalDepositWallet = wallets.find(
                          (w) => w.role === 'botmain'
                        );
                        if (!originalDepositWallet) {
                          throw new Error('Deposit wallet not found');
                        }
                        if (project?.isImported) {
                          throw new Error(
                            'Rapid Snipe is only available for deployed projects through this platform'
                          );
                        }

                        let unpackedSig;
                        console.log('isEmported  : ', project?.isImported);
                        if (!project || !project.tokenAddress) {
                          throw new Error('Token address not found');
                        }
                        // you need to check if this project is not a imported project,
                        // then you should check the owner address of the token address by calling owner() function,
                        const isTradingEnabled = await isTokenTradingEnabled(
                          project?.tokenAddress,
                          project.chainName || 'BSC_MAINNET'
                        );

                        const tokenOwner = await getTokenOwner(
                          project?.tokenAddress,
                          project.chainName || 'BSC_MAINNET'
                        );
                        //check if the token is already enabled for trading
                        if (tokenOwner !== signer?.address) {
                          throw new Error(
                            `Make sure that you've connected the token owner wallet ${tokenOwner} and try again`
                          );
                        }

                        // otherwise, you should sign for a message that will be used to verify the owner of the token address and enable trading in the token smart contract
                        if (!isTradingEnabled) {
                          const signature = await signer?.signTypedData(
                            {
                              name: 'Trading Token',
                              version: '1',
                              chainId: chainId,
                              verifyingContract: project?.tokenAddress,
                            },
                            {
                              Permit: [
                                { name: 'content', type: 'string' },
                                { name: 'nonce', type: 'uint256' },
                              ],
                            },
                            {
                              content: 'Enable Trading',
                              nonce: 0,
                            }
                          );
                          unpackedSig = ethers.Signature.from(signature);
                        }

                        console.log('[ Rapid Snipe ] params ', presetConfig);
                        console.log(
                          '[ Rapid Snipe ] target amount type ',
                          presetConfig.snipeAmountUnit
                        );

                        // setting wallet counts
                        setPresetExecutionStatus('Preparing wallets...');

                        setWalletCount(String(presetConfig.walletCount));
                        walletsInUseCountRef.current = presetConfig.walletCount;
                        console.log(
                          '[2] preparing wallets ',
                          presetConfig.walletCount
                        );
                        // Remove the return statement that was causing early exit
                        const generatedWallets = await handleGenerateWallets(
                          presetConfig.walletCount
                        );

                        if (!generatedWallets) {
                          throw new Error(
                            'Failed to get generated wallets from server'
                          );
                        }

                        await executePreset(
                          generatedWallets,
                          unpackedSig || undefined
                        );
                      } catch (error: any) {
                        console.error('Error in preset execution:', error);
                        setPresetExecutionStatus('Error');
                        toast({
                          title:
                            error.response?.data?.errorType ||
                            'Snipe Execution Error',
                          description:
                            error.response?.data?.errorMessage
                              ?.toString()
                              .slice(0, 200) ||
                            error.message ||
                            'An unknown error occurred',

                          variant: 'destructive',
                        });
                        if (error.response?.data?.errorType.includes('jwt')) {
                          handleDisconnect();
                          router.push('/');
                        }
                      } finally {
                        setIsPresetExecuting(false);
                      }
                    } else if (
                      presetConfig.strategy === PresetStrategy.STAGGERED_SNIPE
                    ) {
                      console.log('STAGGERED_SNIPE');
                      try {
                        setIsPresetExecuting(true);
                        setCurrentStep(WizardStep.PRESET_EXECUTION);

                        const originalDepositWallet = wallets.find(
                          (w) => w.role === 'botmain'
                        );
                        if (!originalDepositWallet) {
                          throw new Error('Deposit wallet not found');
                        }

                        // setting wallet counts
                        setPresetExecutionStatus('Preparing wallets...');

                        walletsInUseCountRef.current = parseInt(walletCount);
                        console.log('[2] preparing wallets ', walletCount);
                        // Remove the return statement that was causing early exit
                        const generatedWallets = await handleGenerateWallets(
                          parseInt(walletCount)
                        );
                        console.log('[3] generated wallets ', generatedWallets);

                        if (!generatedWallets) {
                          throw new Error(
                            'Failed to get generated wallets from server'
                          );
                        }

                        await executePreset(generatedWallets);
                      } catch (error: any) {
                        console.error('Error in preset execution:', error);
                        setPresetExecutionStatus('Error');
                        toast({
                          title:
                            error.response?.data?.errorType ||
                            'Snipe Execution Error',
                          description:
                            error.response?.data?.errorMessage
                              ?.toString()
                              .slice(0, 200) ||
                            error.message ||
                            'An unknown error occurred',

                          variant: 'destructive',
                        });
                        if (error.response?.data?.errorType.includes('jwt')) {
                          handleDisconnect();
                          router.push('/');
                        }
                      } finally {
                        setIsPresetExecuting(false);
                      }
                    }
                  }}
                >
                  Yes, I have done
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-fit"
                  onClick={() => setIsNeedToRemoveWallets(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Apply Preset Button */}
          <div className="flex justify-between space-x-2">
            <Button
              variant="outline"
              className="w-full sm:w-fit"
              onClick={goToPreviousStep}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              className="w-full sm:w-fit"
              disabled={isPresetExecuting}
              onClick={goToNextStep}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Function to handle wallet generation
  const handleGenerateWallets = async (value?: number) => {
    try {
      setIsGeneratingWallets(true);
      const depositWalletWithBalance = wallets.find(
        (w) => w.role === 'botmain'
      );
      if (!depositWalletWithBalance) {
        throw new Error('Deposit wallet not found');
      }

      const newlyFetchedWallets = await fetchWallets();
      // Get number of wallets to generate
      const count = value
        ? value
        : parseInt(newlyFetchedWallets.length.toString(), 10) - 1;
      console.log('[Generate Wallets]', count);
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
      const existingWallets = newlyFetchedWallets.filter(
        (w) => w.role !== 'botmain'
      );
      const existingWalletCount = existingWallets.length;
      console.log(
        '[Generate Wallets] existingWalletCount',
        existingWalletCount
      );
      if (existingWalletCount > count) {
        const counts2delete = existingWalletCount - count;
        const addresses2Delete = existingWallets
          .slice(-counts2delete)
          .map((w) => w.publicKey || '');
        // delete extra wallets
        // get snipe bot id from project
        const snipeBotId = project?.addons?.SnipeBot?._id || '';
        console.log(
          `[Generate Wallets] need to remove wallets`,
          addresses2Delete
        );

        await walletApi.deleteMultipleWallets(snipeBotId, addresses2Delete);

        // Keep the deposit wallet (botmain) and add the selected existing wallets
        const selectedExistingWallets = existingWallets.slice(0, count);
        const updatedWallets = [
          depositWalletWithBalance,
          ...selectedExistingWallets,
        ];

        console.log(
          `[Generate Wallets] existing updated wallets`,
          updatedWallets
        );

        // Update local state
        setWallets(updatedWallets);
        setWalletCount(String(count));

        // Update project state with new wallet list
        setProject((prev: any) => {
          const newProject = {
            ...prev,
            addons: {
              ...prev.addons,
              SnipeBot: {
                ...prev.addons.SnipeBot,
                subWalletIds: selectedExistingWallets.map((w) => ({
                  _id: w._id,
                  publicKey: w.publicKey,
                  role: w.role,
                })),
              },
            },
          };
          return newProject;
        });

        // Update Redux store
        await dispatch(fetchProject(projectId));

        console.log(
          '[Generate Wallets] using existing wallets',
          updatedWallets
        );

        return updatedWallets;
      } else if (existingWalletCount < count) {
        console.log('[Generate Wallets] need to generate wallets');
        // Dispatch the action to generate wallets
        const generatedWallets = await dispatch(
          generateWallets({
            projectId,
            count: count - existingWalletCount,
            botId,
            role: 'botsub',
            botType: 'SnipeBot',
          })
        ).unwrap();

        // Update wallets state
        if (generatedWallets) {
          const walletInfos: WalletInfo[] = generatedWallets.map((wallet) => ({
            _id: wallet._id,
            publicKey: wallet.publicKey,
            role: 'botsub', // Set default role for sub wallets
            nativeBalance: 0,
            tokenBalance: 0,
            sellPercentage: 100,
            nativeFinalInsufficient: 0,
            nativeSpendRate: 90, // Initialize nativeSpendRate to 90%
          }));

          console.log(
            '[Generate Wallets] newly generated wallets',
            walletInfos
          );

          // Combine existing wallets with newly generated ones
          const combinedWallets = [...newlyFetchedWallets, ...walletInfos];
          console.log('[Generate Wallets] combined wallets', combinedWallets);

          // Update local state
          setWallets(combinedWallets);
          setWalletCount(String(combinedWallets.length));

          // Update project state with new wallet list
          setProject((prev: any) => {
            const newProject = {
              ...prev,
              addons: {
                ...prev.addons,
                SnipeBot: {
                  ...prev.addons.SnipeBot,
                  subWalletIds: [...existingWallets, ...walletInfos].map(
                    (w) => ({
                      _id: w._id,
                      publicKey: w.publicKey,
                      role: w.role,
                    })
                  ),
                },
              },
            };
            return newProject;
          });

          // Update Redux store
          await dispatch(fetchProject(projectId));

          return combinedWallets;
        } else {
          throw new Error('Failed to get generated wallets from server');
        }
      } else if (existingWalletCount === count) {
        console.log('[Generate Wallets] no need to generate or remove wallets');
        return newlyFetchedWallets;
      }
    } catch (error) {
      console.error('Error generating wallets:', error);
      throw error;
    } finally {
      setIsGeneratingWallets(false);
    }
  };

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
      const response = await getWalletBalances(
        addresses,
        project.tokenAddress,
        project.chainName || 'BSC_MAINNET'
      );

      // Update only the balances of the selected wallets while preserving all wallet information
      // const updatedWallets = wallets.map((wallet) => {
      //   const balance = response.find(
      //     (b) => b.address.toLowerCase() === wallet.publicKey.toLowerCase()
      //   );

      //   const existingWallet = wallets.find(
      //     (w) => w.publicKey.toLowerCase() === wallet.publicKey.toLowerCase()
      //   );

      //   if (balance && existingWallet) {
      //     console.log('[Fetched Balances] ', wallet);
      //     return {
      //       publicKey: wallet.publicKey,
      //       role:
      //         wallet.publicKey.toLowerCase() ===
      //         project?.addons.SnipeBot.depositWalletId?.publicKey.toLowerCase()
      //           ? 'botmain'
      //           : existingWallet?.role || 'sniping',
      //       _id: existingWallet?._id,
      //       nativeBalance: balance?.nativeBalance || 0,
      //       tokenBalance: balance?.tokenAmount || 0, // Use tokenAmount instead of tokenBalance
      //       nativeToSpend: existingWallet?.nativeToSpend || 0,
      //       nativeFinalInsufficient: existingWallet?.nativeFinalInsufficient || 0,
      //       tokenAmount: existingWallet?.tokenAmount || 0,
      //     };
      //   } else {
      //     console.log('[Fetched Balances] no balance found for wallet', wallet);
      //     return wallet;
      //   }
      // });

      // Map response to wallet info structure || this is the old code
      const updatedWallets = addresses.map((address) => {
        const balance = response.find(
          (b) => b.address.toLowerCase() === address.toLowerCase()
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
          nativeBalance: balance?.nativeBalance || 0,
          tokenBalance: balance?.tokenBalance || 0, // Use tokenAmount instead of tokenBalance
          nativeToSpend: existingWallet?.nativeToSpend || 0,
          nativeFinalInsufficient: existingWallet?.nativeFinalInsufficient || 0,
          tokenAmount: existingWallet?.tokenAmount || 0,
        };
      });

      // setWalletCount(
      //   String(updatedWallets.filter((w) => w.role !== 'botmain').length)
      // );
      setWallets(updatedWallets);
      lastBalanceUpdateRef.current = Date.now();
    } catch (error: any) {
      console.error('Error fetching balances:', error);
      toast({
        title: error.response?.data?.errorType || 'Wallet Balances Fetch Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to fetch wallet balances. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBalances(false);
      balanceFetchInProgressRef.current = false;
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
        project?.chainName === 'BSC_MAINNET'
          ? process.env.NEXT_PUBLIC_BSC_RPC_URL
          : process.env.NEXT_PUBLIC_ETH_RPC_URL
      );

      // Get balance in ETH/BNB
      const balanceWei = await provider.getBalance(
        project.addons.SnipeBot.depositWalletId.publicKey
      );

      // Convert to ethers and format as number
      const balance = parseFloat(ethers.formatEther(balanceWei));

      setDepositWalletBalance(balance);
    } catch (error: any) {
      console.error('Error fetching deposit wallet balance:', error);
      toast({
        title:
          error.response?.data?.errorType ||
          'Deposit Wallet Balance Fetch Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to fetch deposit wallet balance. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDepositWalletBalance(false);
    }
  };

  // Function to fetch pool information
  const fetchPoolInfo = async (): Promise<PoolInfo | null> => {
    if (!project?.tokenAddress || isLoadingPoolInfo) return null;

    try {
      setIsLoadingPoolInfo(true);
      const info = await getPoolInfo(
        project.tokenAddress,
        project.chainName || 'BSC_MAINNET'
      );
      setPoolInfo(info);
      return info;
    } catch (error: any) {
      console.error('Error fetching pool info:', error);
      toast({
        title: error.response?.data?.errorType || 'Pool Info Fetch Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to fetch pool information. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoadingPoolInfo(false);
    }
  };

  // Function to handle fee estimation

  // Function to handle fee estimation
  const handleAllInOneSnipe = async (
    depositW?: WalletInfo,
    updatedWallets1?: WalletInfo[],
    unpackedSig?: any
  ) => {
    if (!project?.tokenAddress || isExecuting) return;

    console.log('[handleAllInOneSnipe] called : parameter', updatedWallets1);
    // Filter only sniping wallets (not deposit wallet)
    const realDepositWallet = depositW
      ? depositW
      : wallets.find((w) => w.role === 'botmain');
    const realSnipingWallets = updatedWallets1
      ? updatedWallets1
      : wallets.filter((w) => w.role !== 'botmain');

    try {
      setIsExecuting(true);

      if (!realDepositWallet || !project?.addons?.SnipeBot?.depositWalletId)
        throw new Error('Deposit wallet not found');

      const tokenAmounts = realSnipingWallets
        .filter((w) => w.role !== 'botmain')
        .map((w) => {
          // Ensure token amount is a valid number and greater than 0
          const amount = Number(w.tokenAmount);
          if (isNaN(amount) || amount <= 0) {
            console.error(
              `Invalid token amount for wallet ${w.publicKey}. ${w.tokenAmount} Amount must be a positive number.`
            );
            return 0;
          }
          return amount;
        });

      console.log(`Original tokenAmounts ==========> `, tokenAmounts);

      // Check pool liquidity
      const poolInfo = await fetchPoolInfo();
      if (!poolInfo) {
        throw new Error('Failed to fetch pool information. Please try again.');
      }

      // Validate pool reserves
      if (!poolInfo.tokenReserve || poolInfo.tokenReserve <= 0) {
        throw new Error('Invalid pool reserves. Please try again later.');
      }

      const totalTokensRequested = tokenAmounts.reduce(
        (sum, amount) => sum + amount,
        0
      );
      const maxAllowedTokens = poolInfo.tokenReserve * 0.95;

      let adjustedTokenAmounts = [...tokenAmounts];

      if (totalTokensRequested > maxAllowedTokens) {
        // Calculate adjustment ratio to maintain relative proportions
        const adjustmentRatio = maxAllowedTokens / totalTokensRequested;

        // Adjust each token amount while maintaining proportions
        adjustedTokenAmounts = tokenAmounts.map(
          (amount) => Math.floor(amount * adjustmentRatio * 100) / 100 // Round down to 2 decimal places
        );

        // Log the adjustment for transparency
        console.log('Token amounts adjusted to fit pool liquidity:', {
          originalTotal: totalTokensRequested,
          adjustedTotal: adjustedTokenAmounts.reduce(
            (sum, amount) => sum + amount,
            0
          ),
          maxAllowed: maxAllowedTokens,
          adjustmentRatio,
          original: tokenAmounts,
          adjusted: adjustedTokenAmounts,
        });

        // Update the wallet token amounts
        realSnipingWallets
          .filter((w) => w.role !== 'botmain')
          .forEach((wallet, index) => {
            wallet.tokenAmount = adjustedTokenAmounts[index];
          });

        // Show toast to inform user about the adjustment
        toast({
          title: 'Token amounts adjusted',
          description: `Token amounts have been automatically adjusted to fit within pool liquidity (95% of pool).`,
          variant: 'default',
        });
      }

      const response = await BotService.allInOneSnipe({
        projectId: project._id,
        botId: project.addons.SnipeBot._id,
        depositWallet: realDepositWallet.publicKey,
        subWallets: realSnipingWallets
          .filter((w) => w.role !== 'botmain')
          .map((w) => w.publicKey),
        tokenAmounts2Buy: adjustedTokenAmounts,
        tokenAddress: project.tokenAddress,
        chainName: project.chainName,
        signature: unpackedSig
          ? {
              v: unpackedSig.v,
              r: unpackedSig.r,
              s: unpackedSig.s,
            }
          : null,
      });

      if (response.success) {
        await fetchBalances([
          realDepositWallet.publicKey,
          ...realSnipingWallets.map((w) => w.publicKey),
        ]);

        toast({
          title: 'All in one snipe Success',
          description:
            'All in one snipe completed, continue with the next step',
        });

        // Call the success callback to refresh parent component balances
        onConfigurationSuccess?.();
      } else {
        console.log('response error', response);
        const errorMessage = response.data.error?.includes(
          'INSUFFICIENT_LIQUIDITY'
        )
          ? 'There is not enough liquidity in the pool to perform this operation. Please try with a smaller amount or wait for more liquidity to be added.'
          : response.data.error;

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error all in one snipe:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSingleSell = async (
    walletAddress: string,
    sellPercentage: number
  ) => {
    try {
      setWallets((prevWallets) =>
        prevWallets.map((w) => ({
          ...w,
          nativeToSpend: 0,
          nativeFinalInsufficient: 0,
        }))
      );
      setExecutingSingleSells((prev) => ({ ...prev, [walletAddress]: true }));
      const result = await BotService.singleWalletSell({
        projectId: project?._id || (projectId as string) || '',
        botId: project?.addons.SnipeBot._id || '',
        walletAddress,
        tokenAddress: project?.tokenAddress || '',
        sellPercentage,
        slippageTolerance: MAX_SLIPPAGE_TOLERANCE,
        targetWalletAddress:
          project?.addons?.SnipeBot?.depositWalletId?.publicKey,
        chainName: project?.chainName || 'BSC_MAINNET',
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

        // Call the success callback to refresh parent component balances
        onConfigurationSuccess?.();
      } else {
        const errorMessage = result.error
          ? result.error
          : 'Failed to sell tokens';

        console.log('[handleSingleSell] error ==========> ', errorMessage);
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

        // Check for insufficient native balance error
        const insufficientNativeMatch = errorString.match(
          /balance for fees\. Required: ([\d.]+) , Available: ([\d.]+) /
        );

        // Check for PancakeRouter INSUFFICIENT_OUTPUT_AMOUNT error
        const insufficientOutputMatch = errorString.includes(
          'PancakeRouter: INSUFFICIENT_OUTPUT_AMOUNT'
        );

        if (insufficientNativeMatch) {
          const requiredNative = insufficientNativeMatch[1];
          const availableNative = insufficientNativeMatch[2];

          setWallets((prevWallets) =>
            prevWallets.map((wallet) =>
              wallet.publicKey === walletAddress
                ? {
                    ...wallet,
                    nativeFinalInsufficient: Number(requiredNative),
                  }
                : wallet
            )
          );
          toast({
            title: 'Error',
            description: `Failed to sell tokens. You need to add ${requiredNative} ${nativeCurrency} to the sniping wallet (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}) to proceed. Available: ${availableNative} ${nativeCurrency}`,
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
    } catch (error: any) {
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to sell tokens',
        variant: 'destructive',
      });
      throw error;
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
        title: 'Warning',
        description:
          'No wallets selected with sufficient token balance for multi-sell',
        variant: 'warning',
      });
      return;
    }

    try {
      setWallets((prevWallets) =>
        prevWallets.map((w) => ({
          ...w,
          nativeToSpend: 0,
          nativeFinalInsufficient: 0,
        }))
      );
      setIsExecutingMultiSell(true);

      const result = (await BotService.multiWalletSell({
        projectId: project?._id || (projectId as string) || '',
        botId: project?.addons.SnipeBot._id || '',
        walletAddresses: selectedWallets.map((w) => w.publicKey),
        tokenAddress: project?.tokenAddress || '',
        sellPercentages: selectedWallets.map((w) => w.sellPercentage || 100), // Default to 100% if not set
        slippageTolerance: MAX_SLIPPAGE_TOLERANCE,
        targetWalletAddress:
          project?.addons.SnipeBot?.depositWalletId?.publicKey,
        chainName: project?.chainName || 'BSC_MAINNET',
      })) as MultiSellResult;

      if (result.success) {
        toast({
          title: 'Success',
          description: `Tokens sold successfully from ${result.successfulTransactions} wallets and failed from ${result.failedTransactions}  wallets ${result.failedTransactions > 0 ? 'due to insufficient Native Currency balance, now refreshing balances' : ''} .`,
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

        // Call the success callback to refresh parent component balances
        onConfigurationSuccess?.();
      } else {
        if (result.failedTransactions > 0 && result.errors.length > 0) {
          const errorMessages = result.errors
            .map((tx) => {
              const insufficientNativeMatch = tx.error.match(
                /Insufficient gas funds\. Required: ([\d.]+) , Available: ([\d.]+) /
              );

              if (insufficientNativeMatch) {
                const requiredNative = insufficientNativeMatch[1];
                const availableNative = insufficientNativeMatch[2];
                setWallets((prevWallets) =>
                  prevWallets.map((wallet) =>
                    wallet.publicKey === tx.wallet
                      ? {
                          ...wallet,
                          nativeFinalInsufficient: Number(requiredNative),
                        }
                      : wallet
                  )
                );
                return `Failed to sell tokens. You need to add ${requiredNative} ${nativeCurrency} to the sniping wallet (${tx.wallet.slice(0, 6)}...${tx.wallet.slice(-4)}) to proceed. Available: ${availableNative} ${nativeCurrency}`;
              } else {
                return tx.error;
              }
            })
            .join('\n');
          throw new Error(`Failed transactions:\n${errorMessages}`);
        } else {
          const errorMessages = result.errors
            .map(
              (tx) =>
                'token sell of ' + tx.wallet + ' failed due to : ' + tx.error
            )
            .join('\n');
          throw new Error(errorMessages || 'Failed to sell tokens');
        }
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.errorType || 'Multi-sell error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          error.message ||
          'Failed to sell tokens',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsExecutingMultiSell(false);
    }
  };

  const handleCollectNative = async () => {
    // Filter wallets that are selected for collection and have native balance > 0
    const selectedWallets = wallets.filter(
      (w) =>
        w.isSelectedForMutilSell &&
        w.role !== 'botmain' &&
        (w.nativeBalance || 0) > 0.00002
    );

    if (selectedWallets.length === 0) {
      toast({
        title: 'Warning',
        description: `No wallets selected with sufficient ${nativeCurrency} balance for collection`,
        variant: 'warning',
      });
      return;
    }

    try {
      setIsCollectingNative(true);
      const result = await BotService.collectNative({
        projectId: project?._id || (projectId as string) || '',
        botId: project?.addons.SnipeBot._id || '',
        walletAddresses: selectedWallets.map((w) => w.publicKey),
        targetWallet:
          project?.addons.SnipeBot?.depositWalletId?.publicKey || '',
        chainName: project?.chainName || 'BSC_MAINNET',
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `${nativeCurrency} collected successfully from all selected wallets`,
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
        throw new Error(result.error || 'Failed to collect native currency');
      }
    } catch (error: any) {
      toast({
        title:
          error.response?.data?.errorType ||
          'Error in collecting native currency',
        description: error.response?.data?.errorMessage
          ?.toString()
          .slice(0, 200),
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsCollectingNative(false);
    }
  };

  // Handler function to execute buy operation for a single wallet
  const handleSingleBuy = async (walletAddress: string) => {
    try {
      setWallets((prevWallets) =>
        prevWallets.map((w) => ({
          ...w,
          nativeToSpend: 0,
          nativeFinalInsufficient: 0,
        }))
      );
      setExecutingSingleBuys((prev) => ({ ...prev, [walletAddress]: true }));

      // Find the wallet to get its nativeSpendRate
      const wallet = wallets.find((w) => w.publicKey === walletAddress);
      const nativeSpendRate = wallet?.nativeSpendRate || 90; // Default to 90% if not specified

      const result = await BotService.singleWalletBuy({
        projectId: project?._id || (projectId as string) || '',
        botId: project?.addons.SnipeBot._id || '',
        walletAddress,
        tokenAddress: project?.tokenAddress || '',
        slippageTolerance: MAX_SLIPPAGE_TOLERANCE,
        targetWalletAddress: walletAddress,
        nativeSpendRate,
        chainName: project?.chainName || 'BSC_MAINNET',
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

        // Call the success callback to refresh parent component balances
        onConfigurationSuccess?.();
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

        const insufficientNativeMatch = errorString.match(
          /balance for fees\. Required: ([\d.]+) , Available: ([\d.]+) /
        );
        // Check for alternative insufficient funds error pattern
        const alternativeInsufficientMatch = errorString.match(
          /Insufficient funds for transaction\. Required: ([\d.]+) , Available: ([\d.]+) /i
        );

        if (insufficientNativeMatch || alternativeInsufficientMatch) {
          const match = insufficientNativeMatch || alternativeInsufficientMatch;
          const requiredNative = match![1];
          const availableNative = match![2];
          const targetWalletAddress = result?.walletAddress || walletAddress;

          setWallets((prevWallets) =>
            prevWallets.map((wallet) =>
              wallet.publicKey === targetWalletAddress
                ? {
                    ...wallet,
                    nativeFinalInsufficient: Number(requiredNative),
                  }
                : wallet
            )
          );
          toast({
            title: 'Error',
            description: `Failed to buy tokens. You need to add ${requiredNative} ${nativeCurrency} to the wallet (${targetWalletAddress.slice(0, 6)}...${targetWalletAddress.slice(-4)}) to proceed. Available: ${availableNative} ${nativeCurrency}`,
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
    } catch (error: any) {
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to buy tokens',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setExecutingSingleBuys((prev) => ({ ...prev, [walletAddress]: false }));
    }
  };

  const _handleDownloadWalletInfo = () => {
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
        [`${nativeCurrency} Balance`]: wallet.nativeBalance
          ? wallet.nativeBalance.toFixed(6)
          : '0',
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
    } catch (error: any) {
      console.error('Error downloading wallet info:', error);
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to download wallet information',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDistributeExtraNative = async () => {
    if (extraDistributeNativeAmount <= 0) {
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
        .filter((w: SubWallet) => w.role !== 'botmain')
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
      const perWalletAmount = extraDistributeNativeAmount;
      const amounts = subWalletAddresses.map(() => perWalletAmount);

      setIsDistributingNative(true);

      //iterate through wallets and make zero to nativeToSpend and nativeFinalInsufficient
      setWallets((prevWallets) =>
        prevWallets.map((wallet) => ({
          ...wallet,
          nativeToSpend: 0,
          nativeFinalInsufficient: 0,
        }))
      );

      const response = await BotService.distributeNative({
        depositWallet: depositWallet.publicKey,
        subWallets: subWalletAddresses,
        amounts,
        projectId: project?._id || '',
        botId: project?.addons.SnipeBot._id || '',
        chainName: project?.chainName || 'BSC_MAINNET',
      });

      if (response?.success?.success) {
        // Refresh balances after distribution
        setTimeout(() => {
          const allAddresses = [depositWallet.publicKey, ...subWalletAddresses];
          fetchBalances(allAddresses);
        }, 1000);

        toast({
          title: 'Success',
          description: `Extra ${nativeCurrency} distributed successfully.`,
        });
      } else {
        // Check for insufficient balance error
        if (response?.success?.error?.includes('Insufficient wallet balance')) {
          const match = response?.success.error.match(
            /Required: ~([\d.]+) , Found: ([\d.]+) /
          );
          if (match) {
            const required = parseFloat(match[1]);
            const found = parseFloat(match[2]);
            const needed = (required - found).toFixed(6);
            toast({
              title: 'Insufficient Balance',
              description: `Failed to distribute Extra ${nativeCurrency}. You need to deposit ${needed} ${nativeCurrency} to your deposit wallet and try again.`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description:
                response?.success?.error ||
                response?.message ||
                `Failed to distribute Extra ${nativeCurrency}`,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Error',
            description:
              response?.success?.error ||
              response?.message ||
              `Failed to distribute Extra ${nativeCurrency}`,
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error(`Error distributing extra ${nativeCurrency}:`, error);
      toast({
        title:
          error.response?.data?.errorType ||
          `Extra ${nativeCurrency} Distribution Error`,
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          `Failed to distribute extra ${nativeCurrency}`,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsDistributingNative(false);
    }
  };

  const executePreset = async (
    generatedWallets: WalletInfo[],
    unpackedSig?: ethers.Signature
  ) => {
    try {
      if (!generatedWallets) {
        throw new Error('Failed to get generated wallets from server');
      }

      generatedWallets = generatedWallets.filter((w) => w.role !== 'botmain');

      // setting token amount
      if (
        !poolInfo ||
        typeof poolInfo.tokenReserve !== 'number' ||
        !poolInfo.tokenReserve
      )
        throw new Error(
          'Pool information is not available. Please refresh pool info.'
        );

      const totalTokens =
        presetConfig?.snipeAmountUnit === 'percentage'
          ? (presetConfig?.snipeAmount / 100) * poolInfo.tokenReserve!
          : presetConfig?.snipeAmount;
      const tokenAmountPerStage = totalTokens / presetConfig?.stageCount;

      console.log(
        `[3] token total snipe amount ${totalTokens}, token amount per stage ${tokenAmountPerStage}`
      );

      const handleEachStage = async () => {
        const total = 100;
        const walletCount = generatedWallets.length; // cause the botmain wallet is included here;
        const base = Math.floor(total / walletCount);
        const minDelta = -Math.floor(base * 0.2); // ~10% below base
        const maxDelta = Math.floor(base * 0.2); // ~10% above base

        const tempPercents: number[] = [];

        // Step 1: Generate bounded random percents around base
        for (let i = 0; i < walletCount; i++) {
          const delta =
            Math.floor(Math.random() * (maxDelta - minDelta + 1)) + minDelta;
          tempPercents.push(base + delta);
        }

        // Step 2: Normalize to ensure total = 100
        const sum = tempPercents.reduce((acc, cur) => acc + cur, 0);
        const diff = total - sum;
        tempPercents[0] += diff; // Fix imbalance on the first item

        // Step 3: Assign to public keys
        const randomPercents: { [address: string]: number } = {};
        generatedWallets.forEach((wallet, i) => {
          randomPercents[wallet.publicKey] = tempPercents[i];
        });

        console.log('[5] random percents ', randomPercents);
        setWalletPercents(randomPercents);

        // Step 4: Calculate token amounts
        const updatedWallets = generatedWallets.map((wallet) => ({
          ...wallet,
          tokenAmount: Math.floor(
            (tokenAmountPerStage * (randomPercents[wallet.publicKey] || 0)) /
              100
          ),
        }));

        setWallets(updatedWallets);

        console.log('[6] wallet token amounts are updated ', updatedWallets);

        await handleAllInOneSnipe(
          updatedWallets.filter((w) => w.role === 'botmain')[0],
          updatedWallets.filter((w) => w.role !== 'botmain'),
          unpackedSig
        );
      };

      // handle each stage

      for (let i = 0; i < presetConfig?.stageCount; i++) {
        console.log(`[${12 + i}] handling each stage `, i + 1);
        const timeToWait =
          presetConfig?.stageTimeDelta === 'very short'
            ? 30000
            : presetConfig?.stageTimeDelta === 'medium'
              ? 120000
              : 300000;

        try {
          await handleEachStage();
          toast({
            title: 'Snipe Success',
            description: `Stage ${i + 1} of ${presetConfig?.stageCount} Staggered Snipe complete.`,
          });
        } catch (error: any) {
          // If an error occurs, set the flag to stop further execution
          console.error('Error in stage:', error);
          toast({
            title: error.response?.data?.errorType || 'Snipe Failed',
            description:
              error.response?.data?.errorMessage?.toString().slice(0, 200) ||
              'An unknown error occurred',
          });
          setPresetExecutionStatus('Error');
          throw error;
        }

        // Only wait between stages if there are more stages to come
        if (i < presetConfig?.stageCount - 1) {
          console.log(`Waiting ${timeToWait}ms before next stage`);
          await new Promise((resolve) => setTimeout(resolve, timeToWait));
        }
      }

      setPresetExecutionStatus('Success');
      toast({
        title: 'Staggered Snipe Success',
        description: 'Staggered Snipe completed successfully.',
      });

      // Call the success callback to enable the toggle
      onConfigurationSuccess?.();

      // Close the modal after successful configuration
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error in preset execution:', error);
      setPresetExecutionStatus('Error');
      toast({
        title: error.response?.data?.errorType || 'Snipe Execution Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          error.message ||
          'An unknown error occurred',

        variant: 'destructive',
      });
      if (error.response?.data?.errorType.includes('jwt')) {
        handleDisconnect();
        router.push('/');
      }
    } finally {
      setIsPresetExecuting(false);
    }
  };

  const handleApplyPreset = async () => {
    try {
      // One-click Staggered Snipe full flow RAPID_SNIPE
      console.log('[0] original wallets ', wallets);
      console.log('[1] current mode ', presetConfig);

      if (presetConfig.strategy === PresetStrategy.RAPID_SNIPE) {
        console.log('project', project);
        if (project?.isImported) {
          throw new Error(
            'Rapid Snipe is only available for deployed projects through this platform'
          );
        }
        // Existing RAPID_SNIPE implementation
        if (wallets.length - 1 > presetConfig.walletCount) {
          // minus 1 because the deposit wallet is included in the original wallets array
          console.log(
            `need to remove wallets - current wallets count: ${wallets.length - 1}, input wallets count: ${presetConfig.walletCount}`
          );
          // show the confirmation component to remove wallets for user to confirm
          setIsNeedToRemoveWallets(true);
        } else {
          // execute the preset
          try {
            setIsPresetExecuting(true);
            setCurrentStep(WizardStep.PRESET_EXECUTION);

            const originalDepositWallet = wallets.find(
              (w) => w.role === 'botmain'
            );
            if (!originalDepositWallet) {
              throw new Error('Deposit wallet not found');
            }
            if (project?.isImported) {
              throw new Error(
                'Rapid Snipe is only available for deployed projects through this platform'
              );
            }

            let shouldSign = false,
              unpackedSig = null;
            const isTradingEnabled = true;
            console.log('isEmported  : ', project?.isImported);
            if (!project || !project.tokenAddress) {
              throw new Error('Token address not found');
            }
            // you need to check if this project is not a imported project,
            // then you should check the owner address of the token address by calling owner() function,
            await isTokenTradingEnabled(
              project?.tokenAddress,
              project.chainName || 'BSC_MAINNET'
            );
            shouldSign = !isTradingEnabled;

            const tokenOwner = await getTokenOwner(
              project?.tokenAddress,
              project.chainName || 'BSC_MAINNET'
            );
            //check if the token is already enabled for trading
            if (tokenOwner !== signer?.address) {
              throw new Error(
                `Make sure that you've connected the token owner wallet ${tokenOwner} and try again`
              );
            }

            // otherwise, you should sign for a message that will be used to verify the owner of the token address and enable trading in the token smart contract
            if (shouldSign) {
              const signature = await signer?.signTypedData(
                {
                  name: 'Trading Token',
                  version: '1',
                  chainId: chainId,
                  verifyingContract: project?.tokenAddress,
                },
                {
                  Permit: [
                    { name: 'content', type: 'string' },
                    { name: 'nonce', type: 'uint256' },
                  ],
                },
                {
                  content: 'Enable Trading',
                  nonce: 0,
                }
              );
              unpackedSig = ethers.Signature.from(signature);
            }

            console.log('[ Rapid Snipe ] params ', presetConfig);
            console.log(
              '[ Rapid Snipe ] target amount type ',
              presetConfig.snipeAmountUnit
            );

            // setting wallet counts
            setPresetExecutionStatus('Preparing wallets...');

            setWalletCount(String(presetConfig.walletCount));
            walletsInUseCountRef.current = presetConfig.walletCount;
            console.log('[2] preparing wallets ', presetConfig.walletCount);
            // Remove the return statement that was causing early exit
            const generatedWallets = await handleGenerateWallets(
              presetConfig.walletCount
            );

            if (!generatedWallets) {
              throw new Error('Failed to get generated wallets from server');
            }

            await executePreset(generatedWallets, unpackedSig || undefined);
          } catch (error: any) {
            console.error('Error in preset execution:', error);
            setPresetExecutionStatus('Error');
            toast({
              title: error.response?.data?.errorType || 'Snipe Execution Error',
              description:
                error.response?.data?.errorMessage?.toString().slice(0, 200) ||
                error.message ||
                'An unknown error occurred',

              variant: 'destructive',
            });
            if (error.response?.data?.errorType.includes('jwt')) {
              handleDisconnect();
              router.push('/');
            }
          } finally {
            setIsPresetExecuting(false);
          }
        }
      } else if (presetConfig.strategy === PresetStrategy.STAGGERED_SNIPE) {
        // setting wallet counts
        const stageMinWalletCount = presetConfig?.stageMinWalletCount || 5;
        const stageMaxWalletCount = presetConfig?.stageMaxWalletCount || 10;

        const randomWalletCount =
          Math.floor(
            Math.random() * (stageMaxWalletCount - stageMinWalletCount + 1)
          ) + stageMinWalletCount;

        setWalletCount(String(randomWalletCount));

        if (wallets.length - 1 > randomWalletCount) {
          // minus 1 because the deposit wallet is included in the original wallets array
          console.log(
            `need to remove wallets - current wallets count: ${wallets.length - 1}, input wallets count: ${randomWalletCount}`
          );
          // show the confirmation component to remove wallets for user to confirm
          setIsNeedToRemoveWallets(true);
        } else {
          // execute the preset
          try {
            setIsPresetExecuting(true);
            setCurrentStep(WizardStep.PRESET_EXECUTION);

            const originalDepositWallet = wallets.find(
              (w) => w.role === 'botmain'
            );
            if (!originalDepositWallet) {
              throw new Error('Deposit wallet not found');
            }

            // setting wallet counts
            setPresetExecutionStatus('Preparing wallets...');

            walletsInUseCountRef.current = randomWalletCount;
            console.log('[2] preparing wallets ', randomWalletCount);
            // Remove the return statement that was causing early exit
            const generatedWallets =
              await handleGenerateWallets(randomWalletCount);
            console.log('[3] generated wallets ', generatedWallets);

            if (!generatedWallets) {
              throw new Error('Failed to get generated wallets from server');
            }

            await executePreset(generatedWallets);
          } catch (error: any) {
            console.error('Error in preset execution:', error);
            setPresetExecutionStatus('Error');
            toast({
              title: error.response?.data?.errorType || 'Snipe Execution Error',
              description:
                error.response?.data?.errorMessage?.toString().slice(0, 200) ||
                error.message ||
                'An unknown error occurred',

              variant: 'destructive',
            });
            if (error.response?.data?.errorType.includes('jwt')) {
              handleDisconnect();
              router.push('/');
            }
          } finally {
            setIsPresetExecuting(false);
          }
        }
        // Reset the executing state, but keep the status
      } else if (presetConfig.strategy === PresetStrategy.PASSIVE_EARLY_BUY) {
        const reqParams = {
          botId: project?.addons.SnipeBot._id || '',
          walletCount: presetConfig.walletCount,
          tokenAmount: presetConfig.snipeAmount,
          symbol: project?.symbol || '',
          tokenAddress: project?.tokenAddress || '',
          pairAddress: project?.pairAddress || '',
          maxSlippage: presetConfig.maxSlippage,
          expirationTime: presetConfig.expirationTime,
          priceThreshold: presetConfig.priceThreshold,
          chainName: project?.chainName || 'BSC_MAINNET',
        };

        console.log('[ passive early buy] params ', reqParams);

        const result = await BotService.sendPassiveSnipeRequest(reqParams);
        console.log('[ passive early buy] result ', result);
        setIsPresetExecuting(false);
        if (result.success) {
          setPresetExecutionStatus('Success');
          toast({
            title: 'Success',
            description:
              result.data ||
              'Passive Early Snipe request accepted successfully.',
          });

          // Call the success callback to enable the toggle
          onConfigurationSuccess?.();

          // Close the modal after successful configuration
          onOpenChange(false);
        } else {
          setPresetExecutionStatus('Error');
          toast({
            title: 'Passive Early Snipe Error',
            description: result.error || 'Passive Early Snipe request failed.',
          });
        }
      }
    } catch (error: any) {
      console.error('Error in preset execution:', error);
      setPresetExecutionStatus('Error');
      toast({
        title: error.response?.data?.errorType || 'Snipe Execution Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          error.message ||
          'An unknown error occurred',

        variant: 'destructive',
      });
      if (error.response?.data?.errorType.includes('jwt')) {
        handleDisconnect();
        router.push('/');
      }
    } finally {
      setIsPresetExecuting(false);
    }
  };

  const fetchWallets = async () => {
    const depositWallet = project?.addons.SnipeBot.depositWalletId;
    const subWallets = project?.addons.SnipeBot.subWalletIds;

    const newWallets: WalletInfo[] = [];

    // Add deposit wallet if it exists
    if (depositWallet) {
      newWallets.push({
        _id: depositWallet._id,
        publicKey: depositWallet.publicKey,
        role: 'botmain',
        sellPercentage: 100,
        isSelectedForMutilSell: false,
        nativeFinalInsufficient: 0,
      });
    }

    // Add sub wallets
    subWallets?.forEach((wallet) => {
      newWallets.push({
        _id: wallet._id,
        publicKey: wallet.publicKey,
        role: wallet.role || 'botsub',
        sellPercentage: 100,
        isSelectedForMutilSell: false,
        nativeFinalInsufficient: 0,
        nativeSpendRate: 90, // Default to 90% native spend rate
      });
    });

    return newWallets.slice();
  };

  const handleMultiBuy = async () => {
    // Filter wallets that are selected and have native balance
    const selectedWallets = wallets.filter(
      (w) =>
        w.isSelectedForMutilSell &&
        w.role !== 'botmain' &&
        (w.nativeBalance || 0) > 0
    );

    if (selectedWallets.length === 0) {
      toast({
        title: 'Warning',
        description: `No wallets selected with sufficient ${nativeCurrency} balance for collection`,
        variant: 'warning',
      });
      return;
    }

    try {
      setWallets((prevWallets) =>
        prevWallets.map((w) => ({
          ...w,
          nativeToSpend: 0,
          nativeFinalInsufficient: 0,
        }))
      );
      setIsExecutingMultiBuy(true);

      const result = await BotService.multiWalletBuy({
        projectId: project?._id || (projectId as string) || '',
        botId: project?.addons.SnipeBot._id || '',
        walletAddresses: selectedWallets.map((w) => w.publicKey),
        tokenAddress: project?.tokenAddress || '',
        slippageTolerance: MAX_SLIPPAGE_TOLERANCE,
        nativeSpendRates: selectedWallets.map((w) => w.nativeSpendRate || 90), // Default to 90% if not set
        chainName: project?.chainName || 'BSC_MAINNET',
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

        // Call the success callback to refresh parent component balances
        onConfigurationSuccess?.();
      } else {
        throw new Error(result.error || 'Failed to buy tokens');
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to buy tokens',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsExecutingMultiBuy(false);
    }
  };

  // Add this helper function to render consistent navigation buttons in each step
  const renderNavigationFooter = (
    disableNext: boolean = false,
    disablePrevious: boolean = false,
    nextLabel: string = 'Next',
    showFinish: boolean = false
  ) => {
    return (
      <div className="flex justify-between space-x-2 mt-6 pt-4 border-t">
        <Button
          className="w-full sm:w-fit"
          variant="outline"
          onClick={goToPreviousStep}
          disabled={disablePrevious || currentStep === WizardStep.INTRODUCTION}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        {showFinish ? (
          <Button
            className="w-full sm:w-fit"
            onClick={onOpenChange ? () => onOpenChange(false) : undefined}
            variant="default"
          >
            Finish
            <CheckCircle2 className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="w-full sm:w-fit"
            onClick={goToNextStep}
            disabled={disableNext || currentStep === WizardStep.POST_OPERATION}
          >
            {nextLabel}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const renderPresetExecutionStep = () => {
    // Using the component-level state for wallet table display
    // No hooks here to avoid the "Rendered more hooks than during the previous render" error
    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'completed':
          return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'pending':
          return <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />;
        case 'error':
          return <XCircle className="h-5 w-5 text-red-500" />;
        default:
          return <Circle className="h-5 w-5 text-gray-400" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed':
          return 'text-green-500';
        case 'pending':
          return 'text-yellow-500';
        case 'error':
          return 'text-red-500';
        default:
          return 'text-gray-400';
      }
    };

    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="p-4 border rounded-lg bg-muted">
          <h3 className="text-lg font-semibold mb-4">
            Preset Snipe Configuration Summary
          </h3>
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm ${getStatusColor(
                presetExecutionStatus === ''
                  ? 'pending'
                  : presetExecutionStatus === 'Error'
                    ? 'error'
                    : presetExecutionStatus === 'Success'
                      ? 'completed'
                      : 'pending'
              )}`}
            >
              {presetExecutionStatus === 'Error'
                ? 'Failed'
                : presetExecutionStatus === 'Success'
                  ? 'Completed'
                  : presetExecutionStatus || 'Pending'}
            </span>
            {getStatusIcon(
              presetExecutionStatus === ''
                ? 'pending'
                : presetExecutionStatus === 'Error'
                  ? 'error'
                  : presetExecutionStatus === 'Success'
                    ? 'completed'
                    : 'pending'
            )}
          </div>
        </div>

        {/* <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(getStepStatus('preparing_wallets'))}
              <span
                className={getStatusColor(getStepStatus('preparing_wallets'))}
              >
                Preparing Wallets
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {getStepStatus('preparing_wallets') === 'completed'
                ? 'Wallets ready'
                : 'Setting up wallets...'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(getStepStatus('estimating_fees'))}
              <span
                className={getStatusColor(getStepStatus('estimating_fees'))}
              >
                Estimating Fees
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {getStepStatus('estimating_fees') === 'completed'
                ? 'Fees calculated'
                : 'Calculating fees...'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(getStepStatus('distributing_native'))}
              <span
                className={getStatusColor(getStepStatus('distributing_native'))}
              >
                Distributing {nativeCurrency}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {getStepStatus('distributing_native') === 'completed'
                ? `${nativeCurrency} distributed`
                : `Distributing ${nativeCurrency}...`}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(getStepStatus('simulating'))}
              <span className={getStatusColor(getStepStatus('simulating'))}>
                Simulating
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {getStepStatus('simulating') === 'completed'
                ? 'Simulation complete'
                : 'Running simulation...'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(getStepStatus('executing'))}
              <span className={getStatusColor(getStepStatus('executing'))}>
                Executing
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {getStepStatus('executing') === 'completed'
                ? 'Execution complete'
                : 'Executing transactions...'}
            </span>
          </div>
        </div> */}

        <div className="mt-8">
          <h4 className="text-sm font-medium mb-4">Wallet Status</h4>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[10%]">No</TableHead>
                  <TableHead>Wallets</TableHead>
                  <TableHead>{nativeCurrency} Balance</TableHead>
                  <TableHead>Buying Tokens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets
                  .filter((w) => w.role !== 'botmain')
                  .slice(0, walletsInUseCountRef.current)
                  .map((wallet, index) => (
                    <TableRow key={wallet.publicKey}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center space-x-2">
                          <span>
                            {wallet.publicKey.slice(0, 6)}...
                            {wallet.publicKey.slice(-4)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(wallet.publicKey)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {wallet.nativeBalance?.toFixed(4) || '0.0000'}
                      </TableCell>
                      <TableCell>
                        {wallet.tokenBalance?.toLocaleString() || 0}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          {/*)} */}
        </div>

        {/* Footer buttons */}
        <div className="flex justify-between space-x-2 mt-6 pt-4 border-t">
          <Button
            className="w-full sm:w-fit"
            variant="outline"
            onClick={goToPreviousStep}
            disabled={isPresetExecuting}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <Button
            className="w-full sm:w-fit"
            onClick={goToNextStep}
            disabled={isPresetExecuting}
          >
            {/* {nextLabel} */}
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Utility function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Address copied to clipboard',
      });
    } catch (error: any) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Render the dialog with a summary panel
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl !p-0 ">
        <DialogHeader className="p-4 sm:p-6 !pb-0">
          <DialogTitle className="pb-2">Bundle Sniping Wizard</DialogTitle>
        </DialogHeader>

        {/* Wizard content area */}
        <div className="flex flex-col space-y-4 max-h-[70vh] overflow-y-auto">
          {renderStepContent()}
        </div>
      </DialogContent>

      {/* Native Deposit Dialog */}
      {project?.addons?.SnipeBot?.depositWalletId?.publicKey && (
        <NativeDepositDialog
          open={isOpenNativeDepositDialog}
          onOpenChange={setIsOpenNativeDepositDialog}
          depositWalletAddress={
            project.addons.SnipeBot.depositWalletId.publicKey
          }
          onSuccess={fetchDepositWalletBalance}
          chainName={project?.chainName || 'BSC_MAINNET'}
        />
      )}
    </Dialog>
  );
}
