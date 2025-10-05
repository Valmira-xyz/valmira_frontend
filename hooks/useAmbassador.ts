import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ambassadorService } from '@/services/ambassadorService';
import type {
  AmbassadorEarningsBreakdown,
  AmbassadorFeeBreakdown,
  AmbassadorOverview,
  AmbassadorPaymentHistory,
  AmbassadorPaymentSettings,
  DirectReferralItem,
  IndirectReferralItem,
} from '@/types';

// Query keys for cache management
export const ambassadorKeys = {
  all: ['ambassador'] as const,
  overview: () => [...ambassadorKeys.all, 'overview'] as const,
  earningsBreakdown: () =>
    [...ambassadorKeys.all, 'earnings-breakdown'] as const,
  feeBreakdown: (type: 'bots' | 'volume' | 'liquidation') =>
    [...ambassadorKeys.all, 'fee-breakdown', type] as const,
  paymentSettings: () => [...ambassadorKeys.all, 'payment-settings'] as const,
  paymentHistory: () => [...ambassadorKeys.all, 'payment-history'] as const,
  directReferrals: () => [...ambassadorKeys.all, 'direct-referrals'] as const,
  indirectReferrals: () =>
    [...ambassadorKeys.all, 'indirect-referrals'] as const,
};

// Hook for ambassador overview
export function useAmbassadorOverview() {
  return useQuery<AmbassadorOverview>({
    queryKey: ambassadorKeys.overview(),
    queryFn: () => ambassadorService.getAmbassadorOverview(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for ambassador earnings breakdown
export function useAmbassadorEarningsBreakdown() {
  return useQuery<AmbassadorEarningsBreakdown[]>({
    queryKey: ambassadorKeys.earningsBreakdown(),
    queryFn: () => ambassadorService.getAmbassadorEarningsBreakdown(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for bot fee breakdown
export function useBotFeeBreakdown() {
  return useQuery<AmbassadorFeeBreakdown[]>({
    queryKey: ambassadorKeys.feeBreakdown('bots'),
    queryFn: () => ambassadorService.getBotFeeBreakdown(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for volume fee breakdown
export function useVolumeFeeBreakdown() {
  return useQuery<AmbassadorFeeBreakdown[]>({
    queryKey: ambassadorKeys.feeBreakdown('volume'),
    queryFn: () => ambassadorService.getVolumeFeeBreakdown(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for liquidation fee breakdown
export function useLiquidationFeeBreakdown() {
  return useQuery<AmbassadorFeeBreakdown[]>({
    queryKey: ambassadorKeys.feeBreakdown('liquidation'),
    queryFn: () => ambassadorService.getLiquidationFeeBreakdown(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for ambassador payment settings
export function useAmbassadorPaymentSettings() {
  return useQuery<AmbassadorPaymentSettings>({
    queryKey: ambassadorKeys.paymentSettings(),
    queryFn: () => ambassadorService.getAmbassadorPaymentSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for updating ambassador payment settings
export function useUpdateAmbassadorPaymentSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<AmbassadorPaymentSettings>) =>
      ambassadorService.updateAmbassadorPaymentSettings(settings),
    onSuccess: () => {
      // Invalidate and refetch payment settings
      queryClient.invalidateQueries({
        queryKey: ambassadorKeys.paymentSettings(),
      });
    },
  });
}

// Hook for payment history
export function useAmbassadorPaymentHistory() {
  return useQuery<AmbassadorPaymentHistory[]>({
    queryKey: ambassadorKeys.paymentHistory(),
    queryFn: () => ambassadorService.getPaymentHistory(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for direct referrals
export function useDirectReferrals() {
  return useQuery<DirectReferralItem[]>({
    queryKey: ambassadorKeys.directReferrals(),
    queryFn: () => ambassadorService.getDirectReferrals(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for indirect referrals
export function useIndirectReferrals() {
  return useQuery<IndirectReferralItem[]>({
    queryKey: ambassadorKeys.indirectReferrals(),
    queryFn: () => ambassadorService.getIndirectReferrals(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Utility hook to invalidate all ambassador queries
export function useInvalidateAmbassadorQueries() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ambassadorKeys.all });
  };
}

// Utility hook for graceful error handling with fallbacks
export function useAmbassadorWithFallback<T>(
  queryResult: { data: T | undefined; isLoading: boolean; error: any },
  fallbackData: T,
  dataLabel: string
) {
  const { data, isLoading, error } = queryResult;

  // Log errors but don't break the UI
  if (error && !isLoading) {
    console.warn(`Ambassador API error for ${dataLabel}:`, error);
    console.info(`Using fallback data for ${dataLabel}`);
  }

  return {
    data: data || fallbackData,
    isLoading,
    hasError: !!error,
    isUsingFallback: !data && !isLoading,
  };
}

// Hook that combines overview data with calculated metrics
export function useEnhancedAmbassadorOverview() {
  const overviewQuery = useAmbassadorOverview();
  const earningsQuery = useAmbassadorEarningsBreakdown();

  // Calculate additional metrics from earnings data
  const calculateTimeBasedEarnings = (earnings: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      todayEarnings: earnings
        .filter((item) => new Date(item.date) >= today)
        .reduce((sum, item) => sum + (item.earnings || 0), 0),
      weeklyEarnings: earnings
        .filter((item) => new Date(item.date) >= weekAgo)
        .reduce((sum, item) => sum + (item.earnings || 0), 0),
      monthlyEarnings: earnings
        .filter((item) => new Date(item.date) >= monthAgo)
        .reduce((sum, item) => sum + (item.earnings || 0), 0),
    };
  };

  const enhancedData = overviewQuery.data
    ? {
        ...overviewQuery.data,
        ...calculateTimeBasedEarnings(earningsQuery.data || []),
      }
    : undefined;

  return {
    data: enhancedData,
    isLoading: overviewQuery.isLoading || earningsQuery.isLoading,
    error: overviewQuery.error || earningsQuery.error,
  };
}
