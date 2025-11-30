'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { ArrowLeftRight, RefreshCw } from 'lucide-react';

import { AddressDisplay } from '@/components/ui/address-display';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useEthersSigner } from '@/lib/ether-adapter';
import { formatNumber } from '@/lib/utils';
import { activationService } from '@/services/activationService';
import {
  buyTokens,
  formatValue,
  getPoolInfo,
  getTokenDecimals,
  getWalletBalances,
  sellTokens,
} from '@/services/web3Utils';
import { RootState } from '@/store/store';
import { PoolInfo, ProjectWithAddons } from '@/types';

type SwapDirection = 'buy' | 'sell';

interface ManualSwapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualSwapDialog({
  open,
  onOpenChange,
}: ManualSwapDialogProps) {
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentProject: project } = useSelector(
    (state: RootState) => state.projects
  ) as { currentProject: ProjectWithAddons | null };

  const getChainIdFromName = (name: string): number => {
    switch (name) {
      case 'BSC_MAINNET':
        return 56;
      case 'ETH_MAINNET':
        return 1;
      default:
        return 1;
    }
  };

  const chainIdForSigner = project?.chainName
    ? getChainIdFromName(project.chainName)
    : 1;
  const signer = useEthersSigner({ chainId: chainIdForSigner });

  const [direction, setDirection] = useState<SwapDirection>('buy');
  const [percent, setPercent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [nativeCurrencyPrice, setNativeCurrencyPrice] = useState<number>(0);
  const [slippage, setSlippage] = useState<string>('10');

  const [balances, setBalances] = useState<{
    native: number;
    token: number;
  }>({ native: 0, token: 0 });
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);

  // Helper function to convert BigInt or number to number
  const toNumber = (
    value: number | bigint | string | undefined | null
  ): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'bigint') {
      return Number(value);
    }
    if (typeof value === 'string') {
      return Number(value) || 0;
    }
    return value;
  };

  // Helper function to get token decimals as a number
  const getTokenDecimalsNumber = (): number => {
    return toNumber(tokenDecimals) || 18;
  };

  const nativeCurrency =
    project?.chainName === 'BSC_MAINNET'
      ? 'BNB'
      : project?.chainName === 'ETH_MAINNET'
        ? 'ETH'
        : project?.chainName === 'SOMNIA_TESTNET' ||
            project?.chainName === 'SOMNIA_MAINNET'
          ? 'SOMI'
          : 'SOL';

  useEffect(() => {
    if (open && user?.walletAddress && project?.tokenAddress) {
      fetchBalances();
      fetchTokenDecimals();
      fetchNativeCurrencyPrice();
      fetchPoolInfo();
    }
  }, [open, user?.walletAddress, project?.tokenAddress]);

  // Recalculate token price when poolInfo or nativeCurrencyPrice changes
  useEffect(() => {
    console.log('Price calculation useEffect triggered:', {
      poolInfo,
      nativeCurrencyPrice,
      hasPoolInfo: !!poolInfo,
      hasPrice: nativeCurrencyPrice > 0,
      chainName: project?.chainName,
    });

    calculateTokenPriceFromPool(
      poolInfo,
      nativeCurrencyPrice,
      project?.chainName
    );
  }, [poolInfo, nativeCurrencyPrice, project?.chainName]);

  const fetchTokenDecimals = async () => {
    if (!project?.tokenAddress || !project?.chainName) return;

    // Use tokenDecimals from project if available, otherwise fetch it
    if (project?.tokenDecimals) {
      setTokenDecimals(toNumber(project.tokenDecimals));
      return;
    }

    try {
      const decimals = await getTokenDecimals(
        project.tokenAddress,
        project.chainName
      );
      setTokenDecimals(toNumber(decimals));
    } catch (error) {
      console.error('Error fetching token decimals:', error);
      // Default to 18 if fetch fails
      setTokenDecimals(18);
    }
  };

  const fetchBalances = async () => {
    if (!user?.walletAddress || !project?.tokenAddress) return;

    try {
      setIsLoading(true);
      const balances = await getWalletBalances(
        [user.walletAddress],
        project.tokenAddress,
        project.chainName
      );

      if (balances.length > 0) {
        setBalances({
          native: toNumber(balances[0].nativeBalance) || 0,
          token: toNumber(balances[0].tokenBalance) || 0,
        });
      }
    } catch (error: any) {
      console.error('Error fetching balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch wallet balances',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNativeCurrencyPrice = async () => {
    if (!project?.chainName) return;

    try {
      let currency: 'BNB' | 'ETH' | 'STT' = 'BNB';
      if (project.chainName === 'ETH_MAINNET') {
        currency = 'ETH';
      } else if (project.chainName === 'SOMNIA_TESTNET') {
        currency = 'STT';
      }

      const priceData =
        await activationService.getNativeCurrencyPrice(currency);
      const price = priceData.price || 0;
      console.log('Fetched native currency price:', { currency, price });
      setNativeCurrencyPrice(price);
    } catch (error) {
      console.error('Error fetching native currency price:', error);
      // Set default price for SOMI on Somnia testnet
      if (
        project?.chainName === 'SOMNIA_TESTNET' ||
        project?.chainName === 'SOMNIA_MAINNET'
      ) {
        console.log('Using default SOMI price: 0.5');
        setNativeCurrencyPrice(0.5);
      } else {
        // Try to set a reasonable default for other chains
        const defaultPrice =
          project.chainName === 'BSC_MAINNET'
            ? 600
            : project.chainName === 'ETH_MAINNET'
              ? 3000
              : 0;
        console.log('Using default price:', defaultPrice);
        setNativeCurrencyPrice(defaultPrice);
      }
    }
  };

  const calculateTokenPriceFromPool = (
    pool: PoolInfo | null,
    nativePrice: number,
    chainName?: string
  ) => {
    if (!pool) {
      setTokenPrice(0);
      return;
    }

    const nativeReserve = toNumber(pool.nativeReserve);
    const tokenReserve = toNumber(pool.tokenReserve);

    console.log('Calculating price from pool:', {
      nativeReserve,
      tokenReserve,
      nativePrice,
      chainName,
    });

    if (nativeReserve > 0 && tokenReserve > 0) {
      // Use nativeCurrencyPrice if available, otherwise use default for SOMI
      const priceToUse =
        nativePrice > 0
          ? nativePrice
          : chainName === 'SOMNIA_TESTNET'
            ? 0.5
            : 0;

      if (priceToUse > 0) {
        const pricePerToken = (nativeReserve / tokenReserve) * priceToUse;
        console.log('Calculated token price:', pricePerToken);
        setTokenPrice(pricePerToken);
      } else {
        console.log('Native currency price is 0, cannot calculate');
        setTokenPrice(0);
      }
    } else {
      console.log('Invalid reserves');
      setTokenPrice(0);
    }
  };

  const fetchPoolInfo = async () => {
    if (!project?.tokenAddress || !project?.chainName) return;

    try {
      const info = await getPoolInfo(project.tokenAddress, project.chainName);
      if (info) {
        console.log('pool info', info);
        setPoolInfo(info);
        // Immediately calculate price if we have native currency price
        calculateTokenPriceFromPool(
          info,
          nativeCurrencyPrice,
          project.chainName
        );
      } else {
        setPoolInfo(null);
        setTokenPrice(0);
      }
    } catch (error) {
      console.error('Error fetching pool info:', error);
      setPoolInfo(null);
      setTokenPrice(0);
    }
  };

  const handlePercentChange = (value: string) => {
    // Only allow numbers and decimal points
    if (/^\d*\.?\d*$/.test(value)) {
      if (direction === 'buy') {
        if (Number(value) > 200) {
          setPercent('200');
        } else if (Number(value) < 0) {
          setPercent('0');
        } else {
          setPercent(value);
        }
      } else {
        if (Number(value) > 100) {
          setPercent('100');
        } else if (Number(value) < 0) {
          setPercent('0');
        } else {
          setPercent(value);
        }
      }
    }
  };

  const handleSwap = async () => {
    if (!percent || !user?.walletAddress || !project?.tokenAddress || !signer)
      return;

    try {
      setIsLoading(true);

      let amount: number;
      if (direction === 'buy') {
        amount = Number(percent); // Use as absolute native currency amount
      } else {
        // Convert percent to actual token amount
        // balances.token is in raw format (with decimals), so we divide by decimals after calculating percentage
        const tokenBalance = toNumber(balances.token);
        const decimals = getTokenDecimalsNumber();
        amount =
          (Number(percent) * tokenBalance) / 100 / Math.pow(10, decimals);
      }

      if (direction === 'buy') {
        if (amount > balances.native) {
          toast({
            title: 'Insufficient balance',
            description: `You do not have enough ${nativeCurrency} to buy tokens`,
            variant: 'warning',
          });
          return;
        }
      }
      // Format amount to avoid scientific notation and ensure it's a valid decimal string
      const formattedAmount = formatValue(amount, 8).toString();
      console.log('amount', amount);
      console.log('balances.token', balances.token);
      console.log('formattedAmount', formattedAmount);

      if (direction === 'buy') {
        await buyTokens(
          signer,
          project.tokenAddress,
          formattedAmount,
          Number(slippage),
          project.chainName
        );
      } else {
        await sellTokens(
          signer,
          project.tokenAddress,
          formattedAmount,
          Number(slippage),
          project.chainName
        );
      }

      toast({
        title: 'Success',
        description: `Successfully ${direction === 'buy' ? 'bought' : 'sold'} tokens`,
      });

      await fetchBalances();
    } catch (error: any) {
      console.error('Error performing swap:', error);
      if (error.message.includes('insufficient')) {
        toast({
          title: 'Swap failed',
          description:
            error.message || 'Swap failed due to insufficient balance',
          variant: 'destructive',
        });
      } else if (error.message.includes('user rejected')) {
        toast({
          title: 'Swap rejected',
          description: 'User cancelled the swap',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Swap failed',
          description: error.message || 'Swap failed due to an unknown error',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDirection = () => {
    setDirection(direction === 'buy' ? 'sell' : 'buy');
    setPercent('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Manual Token Swap</DialogTitle>
          <DialogDescription>
            Swap tokens between your connected wallet and the current project
            token
          </DialogDescription>
        </DialogHeader>

        {/* Pool Address */}
        {project?.pairAddress && (
          <div className="border-t border-b py-3 px-1">
            <AddressDisplay
              address={project.pairAddress}
              label="Pool Address"
              chainName={project.chainName}
              className="text-xs"
            />
          </div>
        )}

        <div className="space-y-4 py-4">
          {/* Wallet Balances */}
          <div className="space-y-2">
            <Label>Wallet Balances</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  {nativeCurrency}
                </p>
                <p className="text-lg font-semibold">
                  {formatValue(balances.native?.toString(), 4)} {nativeCurrency}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Tokens</p>
                <p className="text-lg font-semibold">
                  {formatValue(
                    (
                      toNumber(balances.token) /
                      Math.pow(10, getTokenDecimalsNumber())
                    )?.toString(),
                    4
                  )}{' '}
                  {project?.symbol}
                </p>
              </div>
            </div>
          </div>

          {/* Pool Info */}
          <div className="space-y-2">
            <Label>Pool Information</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  Total Tokens in Pool
                </p>
                <p className="text-lg font-semibold">
                  {formatNumber(toNumber(poolInfo?.tokenReserve))}{' '}
                  {project?.symbol}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Token Price</p>
                <p className="text-lg font-semibold">
                  ${tokenPrice ? formatNumber(tokenPrice, 8) : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Swap Direction */}
          <div className="flex items-center justify-between">
            <Label>Swap Direction</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDirection}
              className="flex items-center gap-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
              {direction === 'buy' ? 'Sell Tokens' : 'Buy Tokens'}
            </Button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-between">
              <Label>
                {direction === 'buy'
                  ? `Amount to spend (${nativeCurrency})`
                  : 'Percent to sell (Tokens)'}
              </Label>
              {direction === 'sell' && (
                <div className="flex gap-1">
                  {[25, 50, 75, 100].map((val) => (
                    <Button
                      key={val}
                      type="button"
                      variant="secondary"
                      className="px-2 py-1 text-xs h-5 font-semibold rounded bg-primary/80 text-primary-foreground shadow hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setPercent(val.toString())}
                    >
                      {val}%
                    </Button>
                  ))}
                </div>
              )}
              {direction === 'buy' && (
                <div className="flex gap-1">
                  {[0.1, 0.2, 0.5, 1].map((val) => (
                    <Button
                      key={val}
                      type="button"
                      variant="secondary"
                      className="px-2 py-1 text-xs h-5 font-semibold rounded bg-primary/80 text-primary-foreground shadow hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setPercent(val.toString())}
                    >
                      {val}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={percent}
                onChange={(e) => handlePercentChange(e.target.value)}
                placeholder={
                  direction === 'buy'
                    ? `Enter amount in ${nativeCurrency}`
                    : 'Enter percent'
                }
                className="flex-1"
                min="0"
                max={direction === 'buy' ? balances.native : 100}
                step="0.01"
              />
              <span className="flex items-center px-3 bg-muted rounded-md">
                {direction === 'buy' ? nativeCurrency : '%'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {direction === 'buy'
                ? `You will spend ${Number(percent) || 0} ${nativeCurrency}`
                : `You will sell ${formatValue(
                    (
                      ((Number(percent) || 0) * toNumber(balances.token)) /
                      100 /
                      Math.pow(10, getTokenDecimalsNumber())
                    )?.toString() || '0',
                    4
                  )} ${project?.symbol}`}
            </p>
          </div>

          {/* Slippage Input */}
          <div className="space-y-2">
            <Label>Slippage Tolerance (%)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={slippage}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                    setSlippage(value);
                  }
                }}
                placeholder="Enter slippage"
                className="flex-1"
                min="0.1"
                max="200"
                step="0.1"
              />
              <span className="flex items-center px-3 bg-muted rounded-md">
                %
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Maximum price impact: {slippage}%
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSwap()}
            disabled={
              isLoading ||
              !percent ||
              !slippage ||
              Number(percent) === 0 ||
              (direction === 'buy' && balances.native === 0) ||
              (direction === 'sell' && toNumber(balances.token) <= 10 ** -9) ||
              Number(slippage) <= 0 ||
              Number(slippage) > 100
            }
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Swap'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
