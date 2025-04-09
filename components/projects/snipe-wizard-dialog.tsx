'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  ArrowRightLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Flame,
  Info,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAccount, useChainId } from 'wagmi';

import { ApproveAndAddLiquidityButtons } from '@/components/projects/ApproveAndAddLiquidityButtons';
import { Badge } from '@/components/ui/badge';
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
import { Progress } from '@/components/ui/progress';
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
import {
  burnLiquidity,
  calculateSnipeAmount as calculatePoolSnipeAmount,
  getLPTokenBalance,
  getPoolInfo,
  getWalletBalances as getWeb3WalletBalances,
  removeLiquidity,
} from '@/services/web3Utils';
import {
  collectBnb,
  deleteMultipleWallets,
  generateWallets,
  getWalletBalances,
  multiSellTokens,
  sellTokens,
} from '@/store/slices/walletSlice';
import type { AppDispatch, RootState } from '@/store/store';
import type { Project } from '@/types';

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
  bnbToSpend?: number;
  bnbBalance?: number;
  tokenAmount?: number;
  tokenBalance?: number;
  insufficientBnb?: number;
  sellPercentage?: number;
  isSelectedForMutilSell?: boolean;
  privateKey?: string; // Add privateKey property
}

interface LiquidationSnipeBotAddon {
  subWalletIds: SubWallet[];
  depositWalletId?: {
    publicKey: string;
    _id: string;
  };
  _id: string;
}

type SimulationResult = {
  wallets: WalletInfo[];
  totalBnbNeeded: number;
  addLiquidityBnb: number;
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
  explorerUrl?: string; // Add explorerUrl property
}

interface PoolInfo {
  bnbReserve: number;
  tokenReserve: number;
  tokenAddress: string;
  bnbAddress: string;
}

interface BurnLiquidityResult {
  success: boolean;
  tokenAmount?: number;
  bnbAmount?: number;
  error?: string;
}

type SnipeWizardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSimulationResult: (success: boolean) => void;
};

// Define the wizard steps
enum WizardStep {
  INTRODUCTION = 0,
  WALLET_SETUP = 1,
  LIQUIDITY_MANAGEMENT = 2,
  SNIPE_CONFIGURATION = 3,
  FEE_DISTRIBUTION = 4,
  SIMULATION = 5,
  EXECUTION = 6,
  POST_OPERATION = 7,
}

export function SnipeWizardDialog({
  open,
  onOpenChange,
  onSimulationResult,
}: SnipeWizardDialogProps) {
  // Track the current wizard step
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    WizardStep.INTRODUCTION
  );

  // State from the original component (we'll maintain the same state variables)
  const dispatch = useDispatch<AppDispatch>();
  const { currentProject, loading: isProjectLoading } = useSelector(
    (state: RootState) => state.projects
  );
  const project = currentProject as ExtendedProject;
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [walletCount, setWalletCount] = useState(
    project?.addons?.SnipeBot?.subWalletIds?.length || 5
  );
  const [snipePercentage, setSnipePercentage] = useState(50);
  const [isBnbDistributed, setIsBnbDistributed] = useState(false);
  const [simulationResult, setSimulationResult] =
    useState<SimulationResult | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [doAddLiquidity, setDoAddLiquidity] = useState(true);
  const [liquidityBnbAmount, setLiquidityBnbAmount] = useState(0);
  const [liquidityTokenAmount, setLiquidityTokenAmount] = useState(0);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [isLoadingPoolInfo, setIsLoadingPoolInfo] = useState(false);
  const { toast } = useToast();
  const balanceUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const lastBalanceUpdateRef = useRef<number>(0);
  const MIN_BALANCE_UPDATE_INTERVAL = 5000; // Minimum 5 seconds between balance updates
  const [isEstimatingFees, setIsEstimatingFees] = useState(false);
  const [isDistributingBNBs, setIsDistributingBNBs] = useState(false);
  const [distributeAmount, setDistributeAmount] = useState<number>(0);
  const [showDistributeDialog, setShowDistributeDialog] =
    useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [estimationResult, setEstimationResult] = useState<any>(null);
  const chainId = useChainId();
  const signer = useEthersSigner({ chainId: chainId || 56 });
  const { address } = useAccount();
  const [connectedWalletBalance, setConnectedWalletBalance] = useState<{
    bnb: number;
    token: number;
  }>({ bnb: 0, token: 0 });
  const [isLoadingConnectedWalletBalance, setIsLoadingConnectedWalletBalance] =
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
  const [slippageTolerance, setSlippageTolerance] = useState(10);
  const [isCollectingBnb, setIsCollectingBnb] = useState(false);
  const balanceFetchInProgressRef = useRef(false);
  const lpTokenFetchInProgressRef = useRef(false);

  // Reset to first step when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(WizardStep.INTRODUCTION);
    }
  }, [open]);

  // Step navigation functions
  const goToNextStep = () => {
    if (currentStep < WizardStep.POST_OPERATION) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > WizardStep.INTRODUCTION) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Core functionality hooks and methods will be implemented here
  // ...

  // Render the appropriate content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.INTRODUCTION:
        return renderIntroductionStep();
      case WizardStep.WALLET_SETUP:
        return renderWalletSetupStep();
      case WizardStep.LIQUIDITY_MANAGEMENT:
        return renderLiquidityManagementStep();
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

  // Placeholder render functions for each step
  const renderIntroductionStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Welcome to the Snipe Wizard</CardTitle>
        <CardDescription>
          This wizard will guide you through the process of setting up and
          executing a token snipe operation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>The wizard consists of the following steps:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li className="font-medium">
              Introduction - Overview of the process
            </li>
            <li className="font-medium">
              Wallet Setup - Manage your sniping wallets
            </li>
            <li className="font-medium">
              Liquidity Management - Add or remove liquidity (optional)
            </li>
            <li className="font-medium">
              Snipe Configuration - Configure your snipe parameters
            </li>
            <li className="font-medium">
              Fee Distribution - Distribute BNB to your sniping wallets
            </li>
            <li className="font-medium">
              Simulation - Simulate the snipe before execution
            </li>
            <li className="font-medium">
              Execution - Execute the snipe operation
            </li>
            <li className="font-medium">
              Post-Operation - Sell tokens and collect BNB
            </li>
          </ol>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <h4 className="text-amber-800 font-medium">Before you start:</h4>
            <ul className="list-disc pl-6 text-amber-700 mt-2">
              <li>Make sure your wallet is connected and has sufficient BNB</li>
              <li>Ensure your token contract is properly configured</li>
              <li>Consider the risks involved in token sniping operations</li>
            </ul>
          </div>
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

            <div className="flex items-center gap-4 mb-4">
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
                    const value = Number.parseInt(e.target.value);
                    if (value > 50) {
                      toast({
                        title: 'Maximum Wallet Count Exceeded',
                        description:
                          'The maximum number of wallets allowed is 50.',
                        variant: 'destructive',
                      });
                      setWalletCount(50);
                    } else {
                      setWalletCount(value);
                      setIsBnbDistributed(false);
                    }
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

            <div className="text-xs text-muted-foreground mb-4">
              You can create up to 50 sniping wallets. Each wallet will be used
              to snipe tokens during execution.
            </div>

            {/* Wallets Table */}
            {wallets.filter((w) => w.role !== 'botmain').length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Wallet Address</TableHead>
                      <TableHead className="text-right">BNB Balance</TableHead>
                      <TableHead className="text-right">
                        Token Balance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets
                      .filter((w) => w.role !== 'botmain')
                      .map((wallet) => (
                        <TableRow key={wallet.publicKey}>
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
            ) : (
              <div className="flex flex-col items-center justify-center py-8 bg-muted/20 rounded-md border border-dashed">
                <p className="text-muted-foreground mb-3">
                  No sniping wallets created yet
                </p>
                <Button
                  onClick={() => handleGenerateWallets()}
                  disabled={isGenerating || isProjectLoading}
                  size="sm"
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create Wallets
                </Button>
              </div>
            )}
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
      </CardContent>
    </Card>
  );

  const renderLiquidityManagementStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Liquidity Management</CardTitle>
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
                <span className="text-xs text-muted-foreground">Address:</span>
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
                    {poolInfo?.tokenReserve?.toLocaleString()} {project?.symbol}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-muted/10 rounded-md">
                {isLoadingPoolInfo ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Loading pool information...</span>
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
                  <Label htmlFor="tokenAmount" className="text-xs font-medium">
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
                tokenAddress={project?.tokenAddress}
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
              You can remove some or all of your liquidity to get back your BNB
              and tokens.
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
                Adding liquidity is optional but necessary if no liquidity pool
                exists yet.
              </li>
              <li>
                When you add liquidity, you receive LP tokens representing your
                share of the pool.
              </li>
              <li>
                You can remove your liquidity at any time to get back your BNB
                and tokens.
              </li>
              <li>Burning liquidity means removing 100% of your LP tokens.</li>
              <li>
                Approve tokens first if this is your first time adding this
                token to a liquidity pool.
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSnipeConfigurationStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-2 sm:px-6 sm:pb-4">
        <CardTitle>Snipe Configuration</CardTitle>
        <CardDescription>
          Configure how much of the token you want to snipe and distribute
          amounts across your wallets.
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
                    onClick={() => copyToClipboard(project?.tokenAddress)}
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

          {/* Rest of content in a two-column grid for wide screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
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
                      project?.tokenAddress,
                      snipePercentage,
                      doAddLiquidity,
                      doAddLiquidity ? liquidityTokenAmount : 0
                    )
                      .then((totalSnipeAmount) => {
                        // Calculate amounts with random variation for each wallet
                        const baseAmountPerWallet =
                          totalSnipeAmount / walletCount;

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
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Wallet</TableHead>
                        <TableHead className="text-right">
                          Token Amount
                        </TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wallets
                        .filter((w) => w.role !== 'botmain')
                        .map((wallet, index) => {
                          const totalAmount = wallets
                            .filter((w) => w.role !== 'botmain')
                            .reduce((sum, w) => sum + (w.tokenAmount || 0), 0);

                          const percentage =
                            totalAmount > 0
                              ? ((wallet.tokenAmount || 0) / totalAmount) * 100
                              : 0;

                          return (
                            <TableRow key={wallet.publicKey}>
                              <TableCell className="font-mono text-xs">
                                Wallet {index + 1}{' '}
                                <span className="hidden sm:inline">
                                  ({wallet.publicKey.slice(0, 4)}...
                                  {wallet.publicKey.slice(-4)})
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
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
                              <TableCell className="text-right">
                                {percentage.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      <TableRow className="bg-muted/20 font-medium">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          {wallets
                            .filter((w) => w.role !== 'botmain')
                            .reduce(
                              (sum, wallet) => sum + (wallet.tokenAmount || 0),
                              0
                            )
                            .toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
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
          </div>

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
            <h3 className="text-base font-medium mb-2">Deposit Wallet</h3>
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

              {simulationResult ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-muted/20 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">
                        BNB for Sniping:
                      </p>
                      <p className="font-medium">
                        {simulationResult.snipingBnb.toFixed(6)} BNB
                      </p>
                    </div>
                    <div className="bg-muted/20 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">
                        Gas Cost:
                      </p>
                      <p className="font-medium">
                        {simulationResult.gasCost?.toFixed(6) || '0.000000'} BNB
                      </p>
                    </div>
                    <div className="bg-muted/20 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">
                        Total BNB Required:
                      </p>
                      <p className="font-medium">
                        {simulationResult.totalBnbNeeded.toFixed(6)} BNB
                      </p>
                    </div>
                  </div>

                  {simulationResult.gasDetails && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-medium mb-2">
                        Detailed Gas Costs:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {simulationResult.gasDetails.snipeGas && (
                          <div>
                            <p className="text-muted-foreground">Snipe Gas:</p>
                            <p>
                              {simulationResult.gasDetails.snipeGas?.toFixed(6)}{' '}
                              BNB
                            </p>
                          </div>
                        )}
                        {simulationResult.gasDetails.distributionGas && (
                          <div>
                            <p className="text-muted-foreground">
                              Distribution Gas:
                            </p>
                            <p>
                              {simulationResult.gasDetails.distributionGas?.toFixed(
                                6
                              )}{' '}
                              BNB
                            </p>
                          </div>
                        )}
                        {simulationResult.gasDetails.openTradingGas && (
                          <div>
                            <p className="text-muted-foreground">
                              Open Trading Gas:
                            </p>
                            <p>
                              {simulationResult.gasDetails.openTradingGas?.toFixed(
                                6
                              )}{' '}
                              BNB
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!simulationResult.sufficientBalance && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-700 text-sm mt-3">
                      <p className="font-medium mb-1">
                        ⚠️ Insufficient BNB Balance
                      </p>
                      <p>
                        Your deposit wallet has{' '}
                        {simulationResult.currentBnbBalance.toFixed(6)} BNB but
                        needs {simulationResult.totalBnbNeeded.toFixed(6)} BNB.
                      </p>
                      <p className="mt-1">
                        Please add{' '}
                        {(
                          simulationResult.totalBnbNeeded -
                          simulationResult.currentBnbBalance
                        ).toFixed(6)}{' '}
                        BNB to continue.
                      </p>
                    </div>
                  )}
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
                BNB Distribution
              </h3>
              <p className="text-sm text-muted-foreground mb-2 sm:mb-4">
                Distribute BNB from your deposit wallet to your sniping wallets.
              </p>

              <div className="space-y-4">
                <Button
                  onClick={handleDistributeBnb}
                  disabled={
                    isEstimatingFees ||
                    !wallets.filter(
                      (wallet: WalletInfo) => wallet.role !== 'botmain'
                    ).length ||
                    isDistributingBNBs ||
                    !simulationResult
                  }
                  className="w-full"
                >
                  {isDistributingBNBs ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Distributing...
                    </>
                  ) : !simulationResult ? (
                    'Estimate Fees First'
                  ) : (
                    'Distribute BNB'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Extra BNB Distribution */}
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-3">
              Distribute Extra BNB (Optional)
            </h3>

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
                className="w-32"
              />
              <span className="text-sm">BNB</span>
              <Button
                variant="outline"
                onClick={() => setShowDistributeDialog(true)}
                disabled={
                  isEstimatingFees ||
                  !wallets.filter(
                    (wallet: WalletInfo) => wallet.role !== 'botmain'
                  ).length ||
                  isDistributingBNBs ||
                  distributeAmount <= 0
                }
              >
                Distribute Extra BNB
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4 text-blue-700 text-sm">
              <p>
                💡 This is useful for providing BNB to wallets for later
                operations like selling tokens.
              </p>
            </div>
          </div>

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
                {simulationResult ? (
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

              {/* BNB Distribution Check */}
              <div className="flex items-center gap-3">
                {isBnbDistributed ? (
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
                <span className="text-sm">BNB distributed to wallets</span>
              </div>

              {/* Sufficient Balance Check */}
              <div className="flex items-center gap-3">
                {simulationResult && simulationResult.sufficientBalance ? (
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
                onClick={handleSimulate}
                disabled={
                  isEstimatingFees ||
                  isSimulating ||
                  !simulationResult ||
                  isExecuting ||
                  !isBnbDistributed ||
                  !wallets
                    .filter((w) => w.role !== 'botmain')
                    .some((w) => (w.tokenAmount || 0) > 0)
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
                        simulationResult.sufficientBalance
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {simulationResult.sufficientBalance
                        ? '✓ Simulation successful! You can proceed to execution.'
                        : '⚠ Simulation completed, but there are insufficient funds.'}
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

          {/* Fee Estimation Results (only show if simulation result exists) */}
          {simulationResult && (
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
                  <p>
                    <span className="text-muted-foreground">
                      BNB for Adding Liquidity:
                    </span>{' '}
                    {simulationResult.addLiquidityBnb.toFixed(4)} BNB
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      BNB for Sniping wallets:
                    </span>{' '}
                    {simulationResult.snipingBnb.toFixed(6)} BNB
                  </p>
                  {simulationResult.tipBnb !== undefined && (
                    <p>
                      <span className="text-muted-foreground">
                        BNB for Bundle Tip:
                      </span>{' '}
                      {simulationResult.tipBnb.toFixed(4)} BNB
                    </p>
                  )}
                  {simulationResult.gasCost !== undefined && (
                    <p>
                      <span className="text-muted-foreground">Gas Cost:</span>{' '}
                      {simulationResult.gasCost.toFixed(6)} BNB
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">
                      Total spending BNB:
                    </span>{' '}
                    {simulationResult.totalBnbNeeded.toFixed(6)} BNB
                  </p>
                </div>

                {simulationResult.poolSimulation &&
                  simulationResult.poolSimulation.initialReserves && (
                    <div className="mt-3 p-2 rounded border bg-background">
                      <h4 className="font-medium mb-1">Pool Simulation</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                        <p>
                          <span className="text-muted-foreground">
                            Initial BNB:
                          </span>{' '}
                          {simulationResult.poolSimulation.initialReserves.bnb.toFixed(
                            4
                          )}{' '}
                          BNB
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Initial Tokens:
                          </span>{' '}
                          {simulationResult.poolSimulation.initialReserves.token.toLocaleString()}{' '}
                          Tokens
                        </p>
                        {simulationResult.poolSimulation.finalReserves && (
                          <>
                            <p>
                              <span className="text-muted-foreground">
                                Final BNB:
                              </span>{' '}
                              {simulationResult.poolSimulation.finalReserves.bnb.toFixed(
                                4
                              )}{' '}
                              BNB
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Final Tokens:
                              </span>{' '}
                              {simulationResult.poolSimulation.finalReserves.token.toLocaleString()}{' '}
                              Tokens
                            </p>
                          </>
                        )}
                        {simulationResult.poolSimulation.priceImpact !==
                          undefined && (
                          <p>
                            <span className="text-muted-foreground">
                              Price Impact:
                            </span>{' '}
                            {(
                              simulationResult.poolSimulation.priceImpact * 100
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
                      simulationResult.sufficientBalance
                        ? 'text-green-500 font-medium'
                        : 'text-red-500 font-medium'
                    }
                  >
                    {simulationResult.sufficientBalance
                      ? '✓ Fee estimation successful. You can proceed to simulation and execution.'
                      : '⚠ Insufficient balance. You need to fill BNB to deposit wallet and then distribute BNB to sniping wallets before proceeding.'}
                  </p>
                </div>

                {!simulationResult.sufficientBalance &&
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

          {/* Navigation Hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4">
            <h3 className="text-base font-medium mb-1">Next Steps</h3>
            <p className="text-sm text-blue-700">
              After successful simulation, proceed to the execution step to
              snipe the token.
            </p>
          </div>
        </div>
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
                      {simulationResult
                        ? simulationResult.totalBnbNeeded.toFixed(6)
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
                  !simulationResult ||
                  !simulationResult.sufficientBalance ||
                  !isBnbDistributed ||
                  !wallets
                    .filter((w) => w.role !== 'botmain')
                    .some((w) => (w.tokenAmount || 0) > 0) ||
                  wallets.filter((w) => w.role !== 'botmain').length === 0
                }
                className="w-full mb-4"
                variant={
                  insufficientFundsDetails ||
                  !simulationResult?.sufficientBalance
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
                simulationResult &&
                !simulationResult.sufficientBalance && (
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
                (!simulationResult || !isBnbDistributed) && (
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
                    <p className="text-muted-foreground">
                      No execution in progress
                    </p>
                    <p className="text-xs mt-2">
                      Click "Execute Bundle" to start the operation
                    </p>
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
          <div className="border rounded-lg p-2 sm:p-4">
            <h3 className="text-base font-medium mb-2 sm:mb-3">
              Wallet Management
            </h3>
            <p className="text-sm text-muted-foreground mb-2 sm:mb-4">
              Manage your wallets, sell tokens, and collect BNB.
            </p>

            {/* Wallet Table */}
            <div className="overflow-x-auto">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Role</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">BNB</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-center">Sell %</TableHead>
                      <TableHead className="text-center">Multi</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets.length > 0 ? (
                      wallets.map((wallet) => (
                        <TableRow key={wallet.publicKey}>
                          <TableCell>
                            <Badge
                              variant={
                                wallet.role === 'botmain'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {wallet.role === 'botmain' ? 'Deposit' : 'Snipe'}
                            </Badge>
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
                            {wallet.bnbBalance?.toFixed(6) || '0.000000'}
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
                    (w) => w.role !== 'botmain' && (w.bnbBalance || 0) > 0.001
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
                Download Wallet Info
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
                Execute Multi Sell
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
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Function to handle wallet generation
  const handleGenerateWallets = async () => {
    if (!project?.addons?.SnipeBot) {
      toast({
        title: 'Bot Not Found',
        description: 'SnipeBot is not configured for this project.',
        variant: 'destructive',
      });
      return;
    }

    const existingWalletCount =
      project?.addons.SnipeBot.subWalletIds?.length || 0;
    const requestedCount = walletCount - existingWalletCount;

    if (walletCount > 50) {
      toast({
        title: 'Maximum Wallet Count Exceeded',
        description: 'The maximum number of wallets allowed is 50.',
        variant: 'destructive',
      });
      setWalletCount(50);
      return;
    }

    // Handle wallet deletion if requested count is less than existing count
    if (requestedCount < 0) {
      const walletsToDelete = project?.addons.SnipeBot.subWalletIds
        .slice(walletCount)
        .map((w) => w._id);
      const confirmDelete = window.confirm(
        `This will delete ${Math.abs(requestedCount)} wallets from the end of your wallet list. This action cannot be undone. Do you want to proceed?`
      );

      if (!confirmDelete) {
        setWalletCount(existingWalletCount);
        return;
      }

      try {
        setIsGenerating(true);
        await dispatch(
          deleteMultipleWallets({
            projectId: project?._id,
            walletIds: walletsToDelete,
          })
        ).unwrap();

        toast({
          title: 'Wallets Deleted',
          description: `Successfully deleted ${Math.abs(requestedCount)} wallets.`,
        });
        return;
      } catch (error) {
        toast({
          title: 'Error Deleting Wallets',
          description:
            error instanceof Error ? error.message : 'Failed to delete wallets',
          variant: 'destructive',
        });
        return;
      } finally {
        setIsGenerating(false);
      }
    }

    try {
      setIsGenerating(true);
      await dispatch(
        generateWallets({
          projectId: project?._id,
          count: requestedCount,
          botId: project?.addons.SnipeBot._id,
        })
      ).unwrap();

      // After generating wallets, fetch their balances with a longer delay
      if (project?.addons.SnipeBot.subWalletIds) {
        const addresses = project?.addons.SnipeBot.subWalletIds.map(
          (wallet: SubWallet) => wallet.publicKey
        );

        // Schedule balance fetch with a longer delay
        if (balanceUpdateTimeoutRef.current) {
          clearTimeout(balanceUpdateTimeoutRef.current);
        }
        balanceUpdateTimeoutRef.current = setTimeout(() => {
          fetchBalances(addresses);
        }, 5000);
      }
    } catch (error) {
      toast({
        title: 'Error Generating Wallets',
        description:
          error instanceof Error ? error.message : 'Failed to generate wallets',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
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
          tokenAmount: existingWallet?.tokenAmount || 0,
        };
      });

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
    if (!signer || lpTokenBalance <= 0 || isRemovingLiquidity) return;

    try {
      setIsRemovingLiquidity(true);

      const result = await removeLiquidity(
        signer,
        project?.tokenAddress,
        removePercentage
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: `Removed ${removePercentage}% of your liquidity`,
        });

        // Log the activity if project ID exists
        if (project?._id) {
          try {
            // Log action without specific method
            console.log('LP removed successfully:', {
              projectId: project._id,
              percentage: removePercentage,
              tokenAmount: result.tokenAmount || 0,
              bnbAmount: result.bnbAmount || 0,
            });
          } catch (error: any) {
            console.error('Failed to log LP removal activity:', error);
          }
        }

        // Refresh balances and pool info
        fetchLpTokenBalance();
        fetchConnectedWalletBalance();
        fetchPoolInfo();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to remove liquidity',
          variant: 'destructive',
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
    if (!signer || lpTokenBalance <= 0 || isBurningLiquidity) return;

    try {
      setIsBurningLiquidity(true);

      const result = await burnLiquidity(signer, project?.tokenAddress);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Successfully burned all LP tokens',
        });

        // Log the activity if project ID exists
        if (project?._id) {
          try {
            // Log action without specific method
            console.log('LP burned successfully:', {
              projectId: project._id,
              tokenAmount: result.tokenAmount || 0,
              bnbAmount: result.bnbAmount || 0,
            });
          } catch (error: any) {
            console.error('Failed to log LP burning activity:', error);
          }
        }

        // Refresh balances and pool info
        fetchLpTokenBalance();
        fetchConnectedWalletBalance();
        fetchPoolInfo();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to burn liquidity',
          variant: 'destructive',
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
        addInitialLiquidity: doAddLiquidity,
        bnbForLiquidity: doAddLiquidity ? liquidityBnbAmount : undefined,
        tokenAmountForLiquidity: doAddLiquidity
          ? liquidityTokenAmount
          : undefined,
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
            insufficientBnb: requirement
              ? Math.max(0, requirement.bnbToSpend - (wallet.bnbBalance || 0))
              : 0,
          };
        });

        setWallets(updatedWallets);

        // Create simulation result
        const simulationData = {
          wallets: updatedWallets,
          totalBnbNeeded: data.totalBnbNeeded,
          snipingBnb: data.subWalletRequirements.reduce(
            (sum, r) => sum + r.bnbToSpend,
            0
          ),
          addLiquidityBnb: data.depositWalletRequirements.bnbForLiquidity || 0,
          tipBnb: data.depositWalletRequirements.bnbForTip,
          gasCost: data.depositWalletRequirements.gasCost,
          currentBnbBalance: data.depositWalletRequirements.currentBnb,
          currentTokenBalance: data.depositWalletRequirements.currentToken,
          tokenAmountRequired:
            data.depositWalletRequirements.tokenAmountRequired,
          sufficientBalance:
            data.depositWalletRequirements.currentBnb >= data.totalBnbNeeded,
          gasDetails: data.estimatedGasCosts,
          poolSimulation: data.poolSimulation,
        };

        setSimulationResult(simulationData);
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
          description: 'Fee estimation completed successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to estimate fees',
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
      !simulationResult ||
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

      const response = await BotService.distributeBnb({
        depositWallet: depositWallet.publicKey,
        subWallets: snipingWallets.map((w) => w.publicKey),
        amounts: snipingWallets.map((w) => w.bnbToSpend || 0),
        projectId: project._id,
        botId: project.addons.SnipeBot._id,
      });

      if (response.success) {
        setIsBnbDistributed(true);

        // Refresh balances after distribution
        setTimeout(() => {
          const allAddresses = [
            depositWallet.publicKey,
            ...snipingWallets.map((w) => w.publicKey),
          ];
          fetchBalances(allAddresses);
        }, 3000);

        toast({
          title: 'Success',
          description: 'BNB distributed successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to distribute BNB',
          variant: 'destructive',
        });
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

  // Function to handle simulation
  const handleSimulate = async () => {
    if (
      !project?.tokenAddress ||
      isSimulating ||
      !wallets.filter((w) => w.role !== 'botmain').length
    )
      return;

    try {
      setIsSimulating(true);

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

      const response = await BotService.simulateSnipe({
        projectId: project._id,
        botId: project.addons.SnipeBot._id,
        depositWallet: depositWallet.publicKey,
        subWallets: snipingWallets.map((w) => w.publicKey),
        tokenAmounts2Buy: tokenAmounts,
        tokenAddress: project.tokenAddress,
        addInitialLiquidity: doAddLiquidity,
        bnbForLiquidity: doAddLiquidity ? liquidityBnbAmount : undefined,
        tokenAmountForLiquidity: doAddLiquidity
          ? liquidityTokenAmount
          : undefined,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Simulation completed successfully',
        });
        onSimulationResult(true);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Simulation failed',
          variant: 'destructive',
        });
        onSimulationResult(false);
      }
    } catch (error) {
      console.error('Error simulating:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to simulate',
        variant: 'destructive',
      });
      onSimulationResult(false);
    } finally {
      setIsSimulating(false);
    }
  };

  // Function to handle execution
  const handleExecute = async () => {
    if (
      !project?.tokenAddress ||
      isExecuting ||
      !wallets.filter((w) => w.role !== 'botmain').length ||
      !isBnbDistributed ||
      insufficientFundsDetails !== null
    )
      return;

    try {
      setIsExecuting(true);

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

      const response = await BotService.executeSnipe({
        projectId: project._id,
        botId: project.addons.SnipeBot._id,
        depositWallet: depositWallet.publicKey,
        subWallets: snipingWallets.map((w) => w.publicKey),
        tokenAmounts2Buy: tokenAmounts,
        tokenAddress: project.tokenAddress,
        addInitialLiquidity: doAddLiquidity,
        bnbForLiquidity: doAddLiquidity ? liquidityBnbAmount : undefined,
        tokenAmountForLiquidity: doAddLiquidity
          ? liquidityTokenAmount
          : undefined,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Snipe execution completed successfully',
        });

        // Move to next step (post-operation)
        setCurrentStep(WizardStep.POST_OPERATION);

        // Refresh balances after execution
        setTimeout(() => {
          const allAddresses = [
            depositWallet.publicKey,
            ...snipingWallets.map((w) => w.publicKey),
          ];
          fetchBalances(allAddresses);
        }, 5000);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Execution failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error executing:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to execute',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Function to handle single wallet sell
  const handleSingleSell = async (
    walletPublicKey: string,
    percentage: number
  ) => {
    if (
      !project ||
      !project.tokenAddress ||
      percentage <= 0 ||
      percentage > 100
    ) {
      toast({
        title: 'Invalid Parameters',
        description: 'Please check the sell percentage and try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setExecutingSingleSells((prev) => ({ ...prev, [walletPublicKey]: true }));

      // Call the API to execute the sell
      const response = await dispatch(
        sellTokens({
          projectId: project._id,
          walletAddress: walletPublicKey,
          tokenAddress: project.tokenAddress,
          percentage,
        })
      ).unwrap();

      if (response.success) {
        toast({
          title: 'Success',
          description: `Successfully sold tokens from wallet.`,
        });

        // Update balances after a short delay
        setTimeout(() => {
          fetchBalances([walletPublicKey]);
        }, 5000);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to sell tokens',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error selling tokens:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to sell tokens',
        variant: 'destructive',
      });
    } finally {
      setExecutingSingleSells((prev) => ({
        ...prev,
        [walletPublicKey]: false,
      }));
    }
  };

  // Function to handle multi wallet sell
  const handleMultiSell = async () => {
    if (!project || !project.tokenAddress) {
      toast({
        title: 'Project Not Found',
        description: 'Project information is missing.',
        variant: 'destructive',
      });
      return;
    }

    const selectedWallets = wallets.filter(
      (w) =>
        w.isSelectedForMutilSell &&
        w.role !== 'botmain' &&
        (w.tokenBalance || 0) > 0
    );

    if (selectedWallets.length === 0) {
      toast({
        title: 'No Wallets Selected',
        description: 'Please select at least one wallet with tokens.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExecutingMultiSell(true);

      // Call the API to execute multi sell
      const response = await dispatch(
        multiSellTokens({
          projectId: project._id,
          tokenAddress: project.tokenAddress,
          walletAddresses: selectedWallets.map((w) => ({
            publicKey: w.publicKey,
            percentage: w.sellPercentage || 100,
          })),
        })
      ).unwrap();

      if (response.success) {
        toast({
          title: 'Success',
          description: `Successfully sold tokens from ${selectedWallets.length} wallets.`,
        });

        // Update wallets to remove selection
        setWallets((prev) =>
          prev.map((w) => ({
            ...w,
            isSelectedForMutilSell: false,
          }))
        );

        // Update balances after a short delay
        setTimeout(() => {
          fetchBalances(selectedWallets.map((w) => w.publicKey));
        }, 5000);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to execute multi sell',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error executing multi sell:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred during multi sell',
        variant: 'destructive',
      });
    } finally {
      setIsExecutingMultiSell(false);
    }
  };

  // Function to handle collecting BNB
  const handleCollectBnb = async () => {
    if (!project) {
      toast({
        title: 'Project Not Found',
        description: 'Project information is missing.',
        variant: 'destructive',
      });
      return;
    }

    const depositWallet = wallets.find((w) => w.role === 'botmain');
    const snipingWallets = wallets.filter(
      (w) => w.role !== 'botmain' && (w.bnbBalance || 0) > 0.001 // Only collect from wallets with sufficient BNB
    );

    if (!depositWallet) {
      toast({
        title: 'Deposit Wallet Not Found',
        description: 'Could not find the deposit wallet.',
        variant: 'destructive',
      });
      return;
    }

    if (snipingWallets.length === 0) {
      toast({
        title: 'No Eligible Wallets',
        description: 'No sniping wallets have sufficient BNB to collect.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCollectingBnb(true);

      // Call the API to collect BNB
      const response = await dispatch(
        collectBnb({
          projectId: project._id,
          sourceWalletAddresses: snipingWallets.map((w) => w.publicKey),
          destinationWalletAddress: depositWallet.publicKey,
        })
      ).unwrap();

      if (response.success) {
        toast({
          title: 'Success',
          description: `Successfully collected BNB from ${snipingWallets.length} wallets.`,
        });

        // Update balances after a short delay
        setTimeout(() => {
          fetchBalances([
            depositWallet.publicKey,
            ...snipingWallets.map((w) => w.publicKey),
          ]);
        }, 5000);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to collect BNB',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error collecting BNB:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred during BNB collection',
        variant: 'destructive',
      });
    } finally {
      setIsCollectingBnb(false);
    }
  };

  // Handle download wallet info
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
        'Private Key': wallet.privateKey || 'Not available',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] lg:max-w-[1100px] xl:max-w-[1200px] max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle>Snipe Wizard</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* Left side - progress and navigation */}
          <div className="lg:w-64 lg:flex-shrink-0 mb-4 lg:mb-0">
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>
                  Step {currentStep + 1} of {WizardStep.POST_OPERATION + 1}
                </span>
                <span className="hidden sm:inline">
                  {
                    Object.keys(WizardStep).filter((key) => isNaN(Number(key)))[
                      currentStep
                    ]
                  }
                </span>
              </div>
              <Progress
                value={
                  ((currentStep + 1) / (WizardStep.POST_OPERATION + 1)) * 100
                }
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mb-4">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStep === WizardStep.INTRODUCTION}
                className="h-9 px-2 sm:px-4"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              <Button
                onClick={goToNextStep}
                disabled={currentStep === WizardStep.POST_OPERATION}
                className="h-9 px-2 sm:px-4"
                size="sm"
              >
                {currentStep === WizardStep.POST_OPERATION ? (
                  <>
                    <CheckCircle className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Finish</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4 sm:ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Step indicator - visible only on larger screens */}
            <div className="hidden lg:block mt-6">
              <h3 className="text-sm font-medium mb-3">Wizard Steps</h3>
              <ul className="space-y-2 text-sm">
                {Object.entries(WizardStep)
                  .filter(([key]) => isNaN(Number(key)))
                  .map(([step, index]) => (
                    <li
                      key={step}
                      className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                        currentStep === Number(index)
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
                        {Number(index) + 1}
                      </span>
                      <span>{step.replace(/_/g, ' ')}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          {/* Right side - step content */}
          <div className="lg:flex-1 overflow-x-auto">{renderStepContent()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
