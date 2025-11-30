'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { ApproveAndAddLiquidityButtons } from './ApproveAndAddLiquidityButtons';
import { ArrowRightLeft, Flame, Loader2 } from 'lucide-react';

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
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { useEthersSigner } from '@/lib/ether-adapter';
import { formatNumber } from '@/lib/utils';
import { projectService } from '@/services/projectService';
import {
  burnLiquidity,
  getLPTokenBalance,
  getPoolInfo,
  getTokenDecimals,
  getWalletBalances,
  removeLiquidity,
} from '@/services/web3Utils';
import { RootState } from '@/store/store';
import { ProjectWithAddons } from '@/types';

interface ManualLPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualLPDialog({ open, onOpenChange }: ManualLPDialogProps) {
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentProject: project } = useSelector(
    (state: RootState) => state.projects
  ) as { currentProject: ProjectWithAddons | null };

  const [liquidityNativeAmount, setLiquidityNativeAmount] = useState<number>(0);
  const [liquidityTokenAmount, setLiquidityTokenAmount] = useState<number>(0);
  const [removePercentage, setRemovePercentage] = useState<number>(100);
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false);
  const [isBurningLiquidity, setIsBurningLiquidity] = useState(false);
  const [connectedWalletBalance, setConnectedWalletBalance] = useState<{
    native: number;
    token: number;
  }>({ native: 0, token: 0 });
  const [lpTokenBalance, setLpTokenBalance] = useState<number>(0);
  const [poolReserves, setPoolReserves] = useState<{
    native: number;
    token: number;
  }>({ native: 0, token: 0 });
  const [_tokenDecimals, setTokenDecimals] = useState<number>(18);
  const signer = useEthersSigner({ chainId: project?.chainId || 56 });

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
      fetchConnectedWalletBalance();
      fetchLpTokenBalance();
      fetchPoolReserves();
      fetchTokenDecimals();
    }
  }, [open, user?.walletAddress, project?.tokenAddress]);

  const fetchTokenDecimals = async () => {
    if (!project?.tokenAddress || !project?.chainName) return;

    // Use tokenDecimals from project if available, otherwise fetch it
    if (project?.tokenDecimals) {
      setTokenDecimals(Number(project.tokenDecimals));
      return;
    }

    try {
      const decimals = await getTokenDecimals(
        project.tokenAddress,
        project.chainName
      );
      setTokenDecimals(Number(decimals));
    } catch (error) {
      console.error('Error fetching token decimals:', error);
      // Default to 18 if fetch fails
      setTokenDecimals(18);
    }
  };

  const fetchConnectedWalletBalance = async () => {
    if (!user?.walletAddress || !project?.tokenAddress) return;

    try {
      const balances = await getWalletBalances(
        [user.walletAddress],
        project.tokenAddress,
        project.chainName
      );

      if (balances.length > 0) {
        setConnectedWalletBalance({
          native: Number(balances[0].nativeBalance) || 0,
          token: Number(balances[0].tokenBalance) || 0,
        });
      }
    } catch (error: any) {
      console.error('Error fetching wallet balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch wallet balances',
        variant: 'destructive',
      });
    }
  };

  const fetchLpTokenBalance = async () => {
    if (!user?.walletAddress || !project?.tokenAddress) return;

    try {
      const balance = await getLPTokenBalance(
        user.walletAddress,
        project.tokenAddress,
        project.chainName || 'BSC_MAINNET'
      );
      setLpTokenBalance(balance);
    } catch (error: any) {
      console.error('Error fetching LP token balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch LP token balance',
        variant: 'destructive',
      });
      setLpTokenBalance(0);
    }
  };

  const fetchPoolReserves = async () => {
    if (!project?.tokenAddress || !project?.chainName) return;
    try {
      const info = await getPoolInfo(project.tokenAddress, project.chainName);
      if (info) {
        setPoolReserves({
          native: info.nativeReserve,
          token: info.tokenReserve,
        });
      }
    } catch (error) {
      console.error('Error fetching pool reserves:', error);
      setPoolReserves({ native: 0, token: 0 });
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!signer || !project?.tokenAddress) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    setIsRemovingLiquidity(true);
    try {
      console.log('Starting liquidity removal...', {
        tokenAddress: project.tokenAddress,
        percentage: removePercentage,
        chainName: project.chainName,
      });

      const result = await removeLiquidity(
        signer,
        project.tokenAddress,
        removePercentage,
        project.chainName || 'BSC_MAINNET'
      );

      console.log('Remove liquidity result:', result);

      if (result.success) {
        toast({
          title: 'Success',
          description: `Liquidity removed successfully! Received ${result.tokenAmount?.toFixed(2)} ${project.symbol} and ${result.nativeAmount?.toFixed(4)} ${nativeCurrency}`,
        });

        // Refresh balances after successful removal
        await Promise.all([
          fetchConnectedWalletBalance(),
          fetchLpTokenBalance(),
          fetchPoolReserves(),
        ]);

        // Log the LP removal activity if project ID exists
        if (project._id) {
          try {
            // Note: Add logLPRemoval method to projectService if needed
            console.log('LP removal completed:', {
              projectId: project._id,
              tokenAmount: result.tokenAmount,
              nativeAmount: result.nativeAmount,
              percentage: removePercentage,
            });
          } catch (error) {
            console.error('Failed to log LP removal activity:', error);
          }
        }
      } else {
        throw new Error(result.error || 'Failed to remove liquidity');
      }
    } catch (error: any) {
      console.error('Error removing liquidity:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove liquidity',
        variant: 'destructive',
      });
    } finally {
      setIsRemovingLiquidity(false);
    }
  };

  const handleBurnLiquidity = async () => {
    if (!signer || !project?.tokenAddress) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    setIsBurningLiquidity(true);
    try {
      const result = await burnLiquidity(
        signer,
        project.tokenAddress,
        project.chainName || 'BSC_MAINNET'
      );

      if (result.success) {
        toast({
          title: 'Success',
          description:
            'All LP tokens burned successfully! Liquidity has been permanently removed.',
        });

        // Refresh balances after successful burning
        await Promise.all([
          fetchConnectedWalletBalance(),
          fetchLpTokenBalance(),
          fetchPoolReserves(),
        ]);

        // Log the LP burn activity if project ID exists
        if (project._id) {
          try {
            console.log('LP tokens burned:', {
              projectId: project._id,
              chainName: project.chainName,
            });
          } catch (error) {
            console.error('Failed to log LP burn activity:', error);
          }
        }
      } else {
        throw new Error(result.error || 'Failed to burn liquidity');
      }
    } catch (error: any) {
      console.error('Error burning liquidity:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to burn liquidity',
        variant: 'destructive',
      });
    } finally {
      setIsBurningLiquidity(false);
    }
  };

  // Helper to match ratio
  const handleMatchRatio = () => {
    if (poolReserves.native > 0 && poolReserves.token > 0) {
      const ratio = poolReserves.token / poolReserves.native;
      if (
        liquidityNativeAmount > 0 &&
        (!liquidityTokenAmount || liquidityTokenAmount === 0)
      ) {
        setLiquidityTokenAmount(
          Number((liquidityNativeAmount * ratio).toFixed(0))
        );
      } else if (
        liquidityTokenAmount > 0 &&
        (!liquidityNativeAmount || liquidityNativeAmount === 0)
      ) {
        const nativeRatio = poolReserves.native / poolReserves.token;
        setLiquidityNativeAmount(
          Number((liquidityTokenAmount * nativeRatio).toFixed(4))
        );
      } else if (liquidityNativeAmount > 0 && liquidityTokenAmount > 0) {
        setLiquidityTokenAmount(
          Number((liquidityNativeAmount * ratio).toFixed(0))
        );
        toast({
          title: 'Match Ratio',
          description: 'Calculation is based on the native currency amount.',
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manual LP Management</DialogTitle>
          <DialogDescription>
            Add or remove liquidity for your token pair
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Wallet Balances */}
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-2">Your Balances</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  {nativeCurrency}
                </p>
                <p className="text-lg font-semibold">
                  {formatNumber(connectedWalletBalance.native)} {nativeCurrency}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  {project?.symbol || 'Token'}
                </p>
                <p className="text-lg font-semibold">
                  {formatNumber(connectedWalletBalance.token)} {project?.symbol}
                </p>
              </div>
            </div>
          </div>

          {/* Add Liquidity Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-2">Add Liquidity</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adding liquidity creates a trading pair for your token on
              PancakeSwap, allowing users to trade it.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* {nativeCurrency} Amount */}
              <div>
                <div className="flex w-full justify-between items-center mb-1">
                  <Label htmlFor="nativeAmount" className="text-xs font-medium">
                    {nativeCurrency} Amount
                  </Label>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 text-xs px-1.5"
                      onClick={() => {
                        const maxNative = connectedWalletBalance.native;
                        setLiquidityNativeAmount(
                          Number((maxNative * 0.1).toFixed(4))
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
                        const maxNative = connectedWalletBalance.native;
                        setLiquidityNativeAmount(
                          Number((maxNative * 0.5).toFixed(4))
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
                        const maxNative = connectedWalletBalance.native;
                        setLiquidityNativeAmount(
                          Number((maxNative * 0.95).toFixed(4))
                        );
                      }}
                    >
                      Max
                    </Button>
                  </div>
                </div>
                <Input
                  id="nativeAmount"
                  type="number"
                  value={liquidityNativeAmount}
                  onChange={(e) =>
                    setLiquidityNativeAmount(Number(e.target.value))
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
            {/* Single Match Ratio Button */}
            <div className="flex justify-center mt-4">
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-sm px-3 font-semibold rounded bg-primary/80 text-primary-foreground shadow hover:bg-primary hover:text-primary-foreground"
                onClick={handleMatchRatio}
              >
                Match Ratio
              </Button>
            </div>

            <div className="mt-4 flex gap-2">
              <ApproveAndAddLiquidityButtons
                tokenAddress={project?.tokenAddress || ''}
                tokenAmount={liquidityTokenAmount.toString()}
                nativeAmount={liquidityNativeAmount.toString()}
                signer={signer || null}
                onSuccess={() => {
                  if (project?._id) {
                    try {
                      projectService
                        .logLPAddition(
                          project._id,
                          Number(liquidityTokenAmount),
                          Number(liquidityNativeAmount),
                          project?.chainName || 'BSC_MAINNET'
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
                  setLiquidityNativeAmount(0);
                  fetchConnectedWalletBalance();
                  fetchLpTokenBalance();
                }}
                chainName={project?.chainName || 'BSC_MAINNET'}
              />
            </div>
          </div>

          {/* Remove Liquidity Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-2">Remove Liquidity</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You can remove some or all of your liquidity to get back your{' '}
              {nativeCurrency} and {project?.symbol}.
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
