'use client';

import { useEffect, useState } from 'react';

import Decimal from 'decimal.js';
import { ethers } from 'ethers';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  addLiquidity,
  approveTokens,
  approveWrappedNative,
  CHAIN_CONFIGS,
  getWrappedNativeBalance,
  hasTokenAllowance,
  hasWrappedNativeAllowance,
  isTokenTradingEnabled,
  updateSwapTokensAtAmount,
  wrapNativeToken,
} from '@/services/web3Utils';

interface ApproveAndAddLiquidityButtonsProps {
  tokenAddress: string;
  tokenAmount: string;
  nativeAmount: string;
  signer: ethers.Signer | null;
  onSuccess?: () => void;
  chainName: string;
}

export function ApproveAndAddLiquidityButtons({
  tokenAddress,
  tokenAmount,
  nativeAmount,
  signer,
  onSuccess,
  chainName,
}: ApproveAndAddLiquidityButtonsProps) {
  const [isApproved, setIsApproved] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [isTradingEnabled, setIsTradingEnabled] = useState(false);
  //const [isCheckingTrading, setIsCheckingTrading] = useState(false);
  //const [isEnablingTrading, setIsEnablingTrading] = useState(false);
  const [isUpdatingSwapThreshold, setIsUpdatingSwapThreshold] = useState(false);

  // WSOMI/Wrapped native token states (for Algebra V4 / QuickSwap)
  const [isWrappedNativeApproved, setIsWrappedNativeApproved] = useState(false);
  const [isCheckingWrappedApproval, setIsCheckingWrappedApproval] =
    useState(false);
  const [isApprovingWrappedNative, setIsApprovingWrappedNative] =
    useState(false);
  const [isWrapping, setIsWrapping] = useState(false);
  const [wrappedNativeBalance, setWrappedNativeBalance] = useState<string>('0');
  const [needsWrapping, setNeedsWrapping] = useState(false);

  const { toast } = useToast();

  const nativeCurrency =
    chainName === 'BSC_MAINNET'
      ? 'BNB'
      : chainName === 'ETH_MAINNET'
        ? 'ETH'
        : chainName === 'SOMNIA_TESTNET' || chainName === 'SOMNIA_MAINNET'
          ? 'SOMI'
          : 'SOL';

  // Wrapped native currency name (for display)
  const wrappedNativeName =
    chainName === 'BSC_MAINNET'
      ? 'WBNB'
      : chainName === 'ETH_MAINNET'
        ? 'WETH'
        : chainName === 'SOMNIA_TESTNET' || chainName === 'SOMNIA_MAINNET'
          ? 'WSOMI'
          : 'WSOL';

  // Network-specific router addresses
  const routerAddress = CHAIN_CONFIGS[chainName].routerAddress;

  // For Algebra V4 chains (like QuickSwap on Somnia), we need to use the Position Manager
  const isAlgebraChain = CHAIN_CONFIGS[chainName].dexType === 'algebraV4';
  const spenderAddress = isAlgebraChain
    ? CHAIN_CONFIGS[chainName].positionManagerAddress || routerAddress
    : routerAddress;

  // Check if token is approved and trading is enabled when component mounts or inputs change
  useEffect(() => {
    const init = async () => {
      await checkTradingStatus();
      await checkApproval();
      // For Algebra V4 chains, also check wrapped native status
      if (isAlgebraChain) {
        await checkWrappedNativeStatus();
      }
    };
    init();
  }, [tokenAddress, tokenAmount, nativeAmount, signer, chainName]);

  // Function to check if trading is enabled
  const checkTradingStatus = async () => {
    if (!signer || !tokenAddress) {
      setIsTradingEnabled(false);
      return;
    }

    try {
      //setIsCheckingTrading(true);
      console.log(
        `🔍 Checking trading status for token: ${tokenAddress} on ${chainName}`
      );
      let tradingEnabled = await isTokenTradingEnabled(
        tokenAddress,
        chainName,
        signer
      );
      console.log(
        `📊 Trading status: ${tradingEnabled ? '✅ ENABLED' : '❌ DISABLED'}`
      );
      if (chainName === 'SOMNIA_TESTNET') {
        tradingEnabled = true;
        setIsTradingEnabled(true); // This is only for testing phases.
      } else {
        setIsTradingEnabled(tradingEnabled);
      }

      if (!tradingEnabled) {
        console.warn(
          '⚠️ TRADING IS DISABLED - You must enable trading before adding liquidity!'
        );
      }
    } catch (error) {
      console.error('Error checking trading status:', error);
      setIsTradingEnabled(false);
    } finally {
      //setIsCheckingTrading(false);
    }
  };

  // Function to check wrapped native token status (for Algebra V4 chains)
  const checkWrappedNativeStatus = async () => {
    if (!signer || !nativeAmount || parseFloat(nativeAmount) <= 0) {
      setIsWrappedNativeApproved(false);
      setNeedsWrapping(false);
      return;
    }

    try {
      setIsCheckingWrappedApproval(true);

      // Get wrapped native balance
      const balance = await getWrappedNativeBalance(signer, chainName);
      setWrappedNativeBalance(balance);
      console.log(`${wrappedNativeName} balance: ${balance}`);

      // Check if user needs to wrap more native tokens
      const requiredAmount = parseFloat(nativeAmount);
      const currentBalance = parseFloat(balance);
      const needsMoreWrapping = currentBalance < requiredAmount;
      setNeedsWrapping(needsMoreWrapping);

      if (needsMoreWrapping) {
        console.log(
          `Need to wrap ${requiredAmount - currentBalance} more ${nativeCurrency}`
        );
        setIsWrappedNativeApproved(false);
        return;
      }

      // Check if wrapped native is approved to Position Manager
      const hasAllowance = await hasWrappedNativeAllowance(
        spenderAddress,
        nativeAmount,
        signer,
        chainName
      );
      setIsWrappedNativeApproved(hasAllowance);
      console.log(
        `${wrappedNativeName} approval status: ${hasAllowance ? '✅ Approved' : '❌ Not approved'}`
      );
    } catch (error) {
      console.error('Error checking wrapped native status:', error);
      setIsWrappedNativeApproved(false);
      setNeedsWrapping(true);
    } finally {
      setIsCheckingWrappedApproval(false);
    }
  };

  // Function to wrap native tokens (SOMI -> WSOMI)
  const handleWrapNative = async () => {
    if (!signer || !nativeAmount || parseFloat(nativeAmount) <= 0) {
      toast({
        title: 'Error',
        description: `Please enter a valid ${nativeCurrency} amount`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsWrapping(true);

      // Calculate how much needs to be wrapped
      const requiredAmount = parseFloat(nativeAmount);
      const currentBalance = parseFloat(wrappedNativeBalance);
      const amountToWrap = Math.max(0, requiredAmount - currentBalance);

      if (amountToWrap <= 0) {
        toast({
          title: 'Info',
          description: `You already have enough ${wrappedNativeName}`,
        });
        setNeedsWrapping(false);
        return;
      }

      // Add a small buffer (5%) to ensure we have enough
      const amountWithBuffer = (amountToWrap * 1.05).toFixed(18);

      console.log(
        `Wrapping ${amountWithBuffer} ${nativeCurrency} to ${wrappedNativeName}...`
      );
      await wrapNativeToken(amountWithBuffer, signer, chainName);

      toast({
        title: 'Success',
        description: `${nativeCurrency} wrapped to ${wrappedNativeName} successfully`,
      });

      // Refresh wrapped native status
      await checkWrappedNativeStatus();
    } catch (error) {
      console.error('Error wrapping native token:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : `Failed to wrap ${nativeCurrency}`,
        variant: 'destructive',
      });
    } finally {
      setIsWrapping(false);
    }
  };

  // Function to approve wrapped native token (WSOMI) to Position Manager
  const handleApproveWrappedNative = async () => {
    if (!signer || !nativeAmount || parseFloat(nativeAmount) <= 0) {
      toast({
        title: 'Error',
        description: `Please enter a valid ${nativeCurrency} amount`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsApprovingWrappedNative(true);
      console.log(`Approving ${wrappedNativeName} to Position Manager...`);

      await approveWrappedNative(
        spenderAddress,
        nativeAmount,
        signer,
        chainName
      );

      setIsWrappedNativeApproved(true);
      toast({
        title: 'Success',
        description: `${wrappedNativeName} approved to Position Manager`,
      });
    } catch (error) {
      console.error('Error approving wrapped native:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : `Failed to approve ${wrappedNativeName}`,
        variant: 'destructive',
      });
    } finally {
      setIsApprovingWrappedNative(false);
    }
  };

  // Function to enable trading
  // const handleEnableTrading = async () => {
  //   if (!signer || !tokenAddress) {
  //     toast({
  //       title: 'Error',
  //       description: 'Please connect your wallet',
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  //   try {
  //     setIsEnablingTrading(true);
  //     console.log(`🚀 Enabling trading for token: ${tokenAddress}`);
  //     const receipt = await enableTrading(tokenAddress, signer);
  //     console.log('✅ Trading enabled! Transaction:', receipt.hash);
  //     setIsTradingEnabled(true);
  //     toast({
  //       title: 'Success',
  //       description: 'Trading enabled successfully! You can now add liquidity.',
  //     });

  //     // Recheck approval status after enabling trading
  //     await checkApproval();
  //   } catch (error) {
  //     console.error('❌ Error enabling trading:', error);
  //     toast({
  //       title: 'Error',
  //       description:
  //         error instanceof Error
  //           ? error.message
  //           : 'Failed to enable trading. Make sure you are the token owner.',
  //       variant: 'destructive',
  //     });
  //   } finally {
  //     setIsEnablingTrading(false);
  //   }
  // };

  // Function to update swap threshold (to prevent auto-swap issues on first LP)
  const handleUpdateSwapThreshold = async () => {
    if (!signer || !tokenAddress) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdatingSwapThreshold(true);
      console.log(`🔧 Updating swap threshold to 1 billion tokens`);
      // Set to 1 billion to effectively disable auto-swap until liquidity is added
      await updateSwapTokensAtAmount(
        tokenAddress,
        '1000000000',
        signer,
        chainName
      );
      toast({
        title: 'Success',
        description:
          'Swap threshold updated! You can now safely add liquidity.',
      });
    } catch (error) {
      console.error('❌ Error updating swap threshold:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update swap threshold. Your token may not support this function yet.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingSwapThreshold(false);
    }
  };

  // Function to check if token is approved
  const checkApproval = async () => {
    if (
      !signer ||
      !tokenAddress ||
      !tokenAmount ||
      parseFloat(tokenAmount) <= 0
    ) {
      setIsApproved(false);
      return;
    }

    try {
      setIsCheckingApproval(true);
      const signerAddress = await signer.getAddress();
      const hasAllowance = await hasTokenAllowance(
        tokenAddress,
        signerAddress,
        spenderAddress, // Use spenderAddress (Position Manager for Algebra, Router for others)
        tokenAmount,
        signer,
        chainName
      );
      setIsApproved(hasAllowance);
    } catch (error) {
      console.error('Error checking token approval:', error);
      setIsApproved(false);
    } finally {
      setIsCheckingApproval(false);
    }
  };

  const formatValue = (value: number | string, decimals = 2): string => {
    const decimalValue = new Decimal(value);
    return decimalValue
      .toDecimalPlaces(decimals, Decimal.ROUND_DOWN)
      .toString();
  };

  // Function to approve tokens
  const handleApprove = async () => {
    if (
      !signer ||
      !tokenAddress ||
      !tokenAmount ||
      parseFloat(tokenAmount) <= 0
    ) {
      toast({
        title: 'Error',
        description: 'Please enter valid token amount and connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log(
        `approveTokens, tokenAddress: ${tokenAddress}, spenderAddress: ${spenderAddress}, tokenAmount: ${tokenAmount}, signer: ${signer}`
      );
      setIsApproving(true);
      await approveTokens(tokenAddress, spenderAddress, tokenAmount, signer); // Use spenderAddress
      setIsApproved(true);
      toast({
        title: 'Success',
        description: `Token approval successful${isAlgebraChain ? ' (Position Manager)' : ''}`,
      });
    } catch (error) {
      console.error('Error approving tokens:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to approve tokens',
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
    }
  };

  // Function to add liquidity
  const handleAddLiquidity = async () => {
    if (
      !signer ||
      !tokenAddress ||
      !tokenAmount ||
      !nativeAmount ||
      parseFloat(tokenAmount) <= 0 ||
      parseFloat(nativeAmount) <= 0
    ) {
      toast({
        title: 'Error',
        description: `Please enter valid token and ${nativeCurrency} amounts and connect your wallet`,
        variant: 'destructive',
      });
      return;
    }

    if (!isApproved) {
      toast({
        title: 'Error',
        description: 'Please approve tokens first',
        variant: 'destructive',
      });
      return;
    }

    // For Algebra V4 chains, also check WSOMI approval
    if (isAlgebraChain && !isWrappedNativeApproved) {
      toast({
        title: 'Error',
        description: `Please approve ${wrappedNativeName} first`,
        variant: 'destructive',
      });
      return;
    }

    // For Algebra V4 chains, check if user needs to wrap native tokens
    if (isAlgebraChain && needsWrapping) {
      toast({
        title: 'Error',
        description: `Please wrap ${nativeCurrency} to ${wrappedNativeName} first`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAddingLiquidity(true);
      await addLiquidity(
        tokenAddress,
        formatValue(tokenAmount, 9),
        formatValue(nativeAmount, 9),
        signer,
        chainName || 'BSC_MAINNET'
      );
      toast({
        title: 'Success',
        description: 'Liquidity added successfully',
      });

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding liquidity:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to add liquidity',
        variant: 'destructive',
      });
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  // If no signer or invalid inputs, disable buttons
  // const isDisabled =
  //   !signer ||
  //   !tokenAddress ||
  //   !tokenAmount ||
  //   !nativeAmount ||
  //   parseFloat(tokenAmount) <= 0 ||
  //   parseFloat(nativeAmount) <= 0;

  return (
    <div className="w-full sm:w-auto flex flex-col gap-2">
      {/* {!isTradingEnabled && (
        <Button
          onClick={handleEnableTrading}
          disabled={!signer || isEnablingTrading || isCheckingTrading}
          variant="default"
          size="sm"
          className="w-full"
        >
          {isEnablingTrading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enabling Trading...
            </>
          ) : isCheckingTrading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Enable Trading (Required First)'
          )}
        </Button>
      )} */}
      {isTradingEnabled && (
        <Button
          onClick={handleUpdateSwapThreshold}
          disabled={!signer || isUpdatingSwapThreshold}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          {isUpdatingSwapThreshold ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Swap Threshold...
            </>
          ) : (
            'Fix Auto-Swap Issue (Optional)'
          )}
        </Button>
      )}

      {/* For Algebra V4 chains (QuickSwap on Somnia), show WSOMI wrap and approval buttons */}
      {isAlgebraChain && (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50 border">
          <p className="text-xs text-muted-foreground">
            QuickSwap requires both {wrappedNativeName} and Token approvals
          </p>

          {/* Step 1: Wrap native tokens if needed */}
          {needsWrapping && (
            <Button
              onClick={handleWrapNative}
              disabled={!signer || isWrapping}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isWrapping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wrapping {nativeCurrency}...
                </>
              ) : (
                `1. Wrap ${nativeCurrency} → ${wrappedNativeName}`
              )}
            </Button>
          )}

          {/* Step 2: Approve WSOMI if wrapped but not approved */}
          {!needsWrapping && !isWrappedNativeApproved && (
            <Button
              onClick={handleApproveWrappedNative}
              disabled={
                !signer || isApprovingWrappedNative || isCheckingWrappedApproval
              }
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isApprovingWrappedNative ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving {wrappedNativeName}...
                </>
              ) : isCheckingWrappedApproval ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking {wrappedNativeName}...
                </>
              ) : (
                `2. Approve ${wrappedNativeName}`
              )}
            </Button>
          )}

          {/* Show status indicators */}
          <div className="flex gap-2 text-xs">
            <span
              className={needsWrapping ? 'text-yellow-500' : 'text-green-500'}
            >
              {needsWrapping ? '○' : '●'} {wrappedNativeName}:{' '}
              {parseFloat(wrappedNativeBalance).toFixed(4)}
            </span>
            <span
              className={
                isWrappedNativeApproved ? 'text-green-500' : 'text-yellow-500'
              }
            >
              {isWrappedNativeApproved ? '●' : '○'} {wrappedNativeName} Approved
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {!isApproved && (
          <Button
            onClick={handleApprove}
            // disabled={
            //   isDisabled ||
            //   isApproving ||
            //   isCheckingApproval ||
            //   !isTradingEnabled
            // }
            variant="outline"
            size="sm"
          >
            {isApproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : isCheckingApproval ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : isAlgebraChain ? (
              `${!needsWrapping && isWrappedNativeApproved ? '3. ' : ''}Approve Token`
            ) : (
              'Approve Tokens'
            )}
          </Button>
        )}
        <Button
          onClick={handleAddLiquidity}
          disabled={
            isAlgebraChain &&
            (needsWrapping || !isWrappedNativeApproved || !isApproved)
          }
          size="sm"
        >
          {isAddingLiquidity ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Liquidity...
            </>
          ) : (
            'Add Liquidity'
          )}
        </Button>
      </div>
    </div>
  );
}
