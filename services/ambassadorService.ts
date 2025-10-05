// FILE: src/services/api/ambassadorService.ts

import type { DateRange } from 'react-day-picker';

import { apiClient } from './apiService'; // Your configured axios instance

// =================================================================
// DATA-TRANSFER INTERFACES (DTOs)
// These define the shape of the data being transferred between
// your frontend and backend. They should mirror your backend responses.
// =================================================================

export interface EnhancedOverviewData {
  totalEarned: number;
  availableBalance: number;
  directReferrals: number;
  indirectReferrals: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  averageDailyEarning: number;
  conversionRate: number;
  referralCode?: string;
  mostProfitableReferral: {
    projectName: string;
    earnings: number;
    formattedDisplay: string; // e.g., "PEPE ($123)"
  } | null;
  ambassadorRank: {
    rank: string;
    nextRankThreshold: number;
    progressPercentage: number;
  };
  clickTrackingStats: {
    totalClicks: number;
    weeklyClicks: number;
    conversionRate: number;
  };
}

export interface ProjectEarning {
  projectName: string;
  projectId: string;
  dailyBotFee: number;
  numberOfBots: number;
  totalFee: number;
  percentage: number;
  earnings: number;
  date: string;
  owner: {
    username: string;
    walletAddress: string;
  };
}

export interface EnhancedFeeBreakdown {
  projectName: string;
  projectId: string;
  dailyBotFee: string;
  numberOfBots: number;
  totalFee: string;
  percentage: string;
  earnings: string;
  date: string;
}

export interface DirectReferral {
  id: string;
  username: string;
  joinedDate: string;
  status: 'active' | 'inactive';
  projectName?: string;
  monthlyFee: number;
  earnings: number;
  clicksGenerated: number;
}

export interface IndirectReferral {
  id: string;
  username: string;
  referrerUsername: string;
  joinedDate: string;
  status: 'active' | 'inactive';
  totalCommissionEarned: number;
}

export interface PaymentSettings {
  paymentAddress: string;
  paymentCurrency: 'USDT' | 'USDC' | 'ETH' | 'BNB';
  autoWithdrawEnabled: boolean;
  minAutoWithdraw: number;
  availableBalance: number;
}

export interface PaymentHistoryItem {
  transactionHash: string;
  amount: number;
  currency: string;
  date: string;
}

interface DailyEarningApiResponse {
  date: string; // The API sends the date as a string
  earnings: number;
}

export interface DailyEarning {
  date: string; // Keep as string for DataChart compatibility
  earnings: number;
}

// =================================================================
// API SERVICE FUNCTIONS
// These functions use the apiClient to make network requests.
// =================================================================

/**
 * Fetches the main enhanced overview data for the ambassador dashboard.
 */
export const getEnhancedOverview = async (): Promise<EnhancedOverviewData> => {
  const response = await apiClient.get<EnhancedOverviewData>(
    '/users/me/ambassador/dashboard/enhanced'
  );
  return response.data;
};

/**
 * Fetches the project-level earnings breakdown.
 */
export const getProjectEarnings = async (
  dateRange?: DateRange
): Promise<ProjectEarning[]> => {
  const params = dateRange
    ? {
        startDate: dateRange.from?.toISOString(),
        endDate: dateRange.to?.toISOString(),
      }
    : {};
  const response = await apiClient.get<ProjectEarning[]>(
    '/users/me/ambassador/earnings/projects',
    { params }
  );
  return response.data;
};

/**
 * Fetches the detailed breakdown for a specific fee type.
 */
export const getFeeBreakdown = async (
  feeType: 'bots' | 'volume' | 'liquidation',
  dateRange?: DateRange
): Promise<EnhancedFeeBreakdown[]> => {
  const apiFeeTypeMap = {
    bots: 'daily_bot_fees',
    volume: 'volume_fees',
    liquidation: 'liquidation_fees',
  };
  const apiFeeType = apiFeeTypeMap[feeType];
  const params = dateRange
    ? {
        startDate: dateRange.from?.toISOString(),
        endDate: dateRange.to?.toISOString(),
      }
    : {};
  const response = await apiClient.get<EnhancedFeeBreakdown[]>(
    `/users/me/ambassador/fee-breakdown/${apiFeeType}/enhanced`,
    { params }
  );
  return response.data;
};

/**
 * Fetches the ambassador's current payment settings.
 */
export const getPaymentSettings = async (): Promise<PaymentSettings> => {
  const response = await apiClient.get<PaymentSettings>(
    '/users/me/ambassador/settings'
  );
  return response.data;
};

/**
 * Updates the ambassador's payment settings.
 */
export const updatePaymentSettings = async (
  settings: Partial<PaymentSettings>
): Promise<void> => {
  await apiClient.put('/users/me/ambassador/settings', settings);
};

/**
 * Initiates a manual withdrawal request.
 */
export const requestWithdrawal = async (): Promise<void> => {
  //   await apiClient.post('/users/me/ambassador/withdraw');
  return;
};

/**
 * Fetches the list of direct (L1) referrals.
 */
export const getDirectReferrals = async (): Promise<DirectReferral[]> => {
  const response = await apiClient.get<DirectReferral[]>(
    '/users/me/ambassador/referrals/direct/enhanced'
  );
  return response.data;
};

/**
 * Fetches the list of indirect (L2) referrals.
 * Note: Assumes an endpoint exists at '/ambassadors/me/referrals/indirect/enhanced'
 */
export const getIndirectReferrals = async (): Promise<IndirectReferral[]> => {
  const response = await apiClient.get<IndirectReferral[]>(
    '/users/me/ambassador/referrals/indirect'
  ); // Adjust endpoint if you create an 'enhanced' version
  return response.data;
};

/**
 * Fetches the ambassador's payout history.
 */
export const getPaymentHistory = async (): Promise<PaymentHistoryItem[]> => {
  const response = await apiClient.get<PaymentHistoryItem[]>(
    '/users/me/ambassador/payment-history'
  );
  return response.data;
};

export const getEarningsBreakdown = async (): Promise<DailyEarning[]> => {
  try {
    // 1. Fetch the data, telling TypeScript to expect the raw API shape.
    const { data: rawData } = await apiClient.get<DailyEarningApiResponse[]>(
      '/users/me/ambassador/earnings/breakdown'
    );

    // 2. Handle the case where the API might return null or not an array.
    if (!Array.isArray(rawData)) {
      console.error('API did not return an array for earnings breakdown.');
      return []; // Return an empty array to prevent crashes.
    }

    // 3. Transform the raw data into the format our frontend needs.
    const transformedData: DailyEarning[] = rawData.map((item) => ({
      earnings: item.earnings,
      date: item.date, // Keep as string for DataChart compatibility
    }));

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch or transform earnings breakdown:', error);
    return []; // Return an empty array on error to prevent the app from crashing.
  }
};
