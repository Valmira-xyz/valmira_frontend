'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { useSelector } from 'react-redux';

import { subWeeks } from 'date-fns';
import { motion } from 'framer-motion';
// import {
//   mockAmbassadorEarningsBreakdownData,
//   mockAmbassadorFeeBreakdownDataBots,
//   mockAmbassadorFeeBreakdownDataLiquidation,
//   mockAmbassadorFeeBreakdownDataVolume,
// } from '@/lib/mock-data';
import { useQuery } from '@tanstack/react-query';

import { DataChart } from '@/components/ui/data-chart';
import { DataTable } from '@/components/ui/data-table';
import {
  getEarningsBreakdown,
  getFeeBreakdown,
  getProjectEarnings,
} from '@/services/ambassadorService';
import { RootState } from '@/store/store';
// interface FeeBreakdownItem {
//   projectName: string;
//   dailyBotFee: string;
//   numberOfBots: number;
//   totalFee: string;
//   percentage: string;
//   earnings: string;
//   date: string;
// }

interface AmbassadorEarningBreakdownProps {
  dateRange?: DateRange;
}

export function AmbassadorEarningBreakdown({
  dateRange: initialDateRange,
}: AmbassadorEarningBreakdownProps) {
  // Check authentication state
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialDateRange || {
      from: subWeeks(new Date(), 30),
      to: new Date(),
    }
  );
  const [feeDateRange, setFeeDateRange] = useState<DateRange | undefined>(
    initialDateRange || {
      from: subWeeks(new Date(), 7),
      to: new Date(),
    }
  );

  const [selectedFeeType, setSelectedFeeType] = useState<
    'bots' | 'volume' | 'liquidation'
  >('bots');

  // const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdownItem[]>([]);
  // const [selectedDataTabButton, setSelectedDataTabButton] =
  //   useState<string>('bots');

  const {
    data: dailyEarningsData,
    isLoading: isDailyEarningsLoading,
    isError: isDailyEarningsError,
  } = useQuery({
    queryKey: ['ambassadorEarningsBreakdown', dateRange],
    queryFn: () => getEarningsBreakdown(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  const {
    data: projectEarningsData,
    isLoading: isProjectEarningsLoading,
    isError: isProjectEarningsError,
  } = useQuery({
    queryKey: ['projectEarnings', dateRange],
    queryFn: () => getProjectEarnings(dateRange),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  const {
    data: feeBreakdownData,
    isLoading: isFeeBreakdownLoading,
    isError: isFeeBreakdownError,
  } = useQuery({
    queryKey: ['feeBreakdown', selectedFeeType, feeDateRange],
    queryFn: () => getFeeBreakdown(selectedFeeType, feeDateRange),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  // const handleDataTabChange = (value: string) => {
  //   if (value === 'bots') {
  //     setFeeBreakdown(mockAmbassadorFeeBreakdownDataBots);
  //     setSelectedDataTabButton(value);
  //   } else if (value === 'volume') {
  //     setFeeBreakdown(mockAmbassadorFeeBreakdownDataVolume);
  //     setSelectedDataTabButton(value);
  //   } else {
  //     setFeeBreakdown(mockAmbassadorFeeBreakdownDataLiquidation);
  //     setSelectedDataTabButton(value);
  //   }
  // };

  // Error display component
  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-500 mb-4">
      <p className="font-medium">Error</p>
      <p>{message}</p>
    </div>
  );

  // Handle unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="text-center p-8 border border-muted rounded-lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
          <p className="text-muted-foreground">
            Please connect your wallet to view your earnings breakdown and
            analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isDailyEarningsError ? (
        <ErrorDisplay message="Failed to load earnings data. Please try again later." />
      ) : (
        <DataChart
          title="Daily Earnings Breakdown"
          description="Your earnings split by fee type"
          data={dailyEarningsData || []}
          isLoading={isDailyEarningsLoading}
          dataKey="earnings"
          color="hsl(var(--chart-1))"
          showDateRange={true}
          showDateButtons={true}
          showChartTypeSelector={true}
          showHeaderInVertical={false}
          dateRange={dateRange}
          onDateRangeChange={(range: DateRange | undefined) => {
            if (range) {
              setDateRange(range);
            }
          }}
        />
      )}

      {isProjectEarningsError ? (
        <ErrorDisplay message="Failed to load project earnings data. Please try again later." />
      ) : (
        <DataTable
          data={projectEarningsData || []}
          isLoading={isProjectEarningsLoading}
          dateFieldName="date"
          showColumns={[
            {
              name: 'projectName',
              type: 'normal',
              displayName: 'Project Name',
            },
            {
              name: 'dailyBotFee',
              type: 'price',
              displayName: 'Daily Bot Fee',
            },
            {
              name: 'numberOfBots',
              type: 'normal',
              displayName: 'Number of bots',
            },
            { name: 'totalFee', type: 'price', displayName: 'Total fee' },
            { name: 'percentage', type: 'percent', displayName: 'Your %' },
            { name: 'earnings', type: 'price', displayName: 'Earnings' },
            // { name: 'date', type: 'time', displayName: 'Date' },
          ]}
          showSearchInput={false}
          showCheckbox={false}
          showPagination={true}
          showDateRange={true}
          showDateButtons={true}
          showDownloadButton={false}
          showTableHeaderInVertical={true}
          showTitleSideByside={true}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          title="Earning by project"
          description="Distribution of earning across your refferred projects"
        />
      )}
      {isFeeBreakdownError ? (
        <ErrorDisplay message="Failed to load fee breakdown data. Please try again later." />
      ) : (
        <DataTable
          data={feeBreakdownData || []}
          isLoading={isFeeBreakdownLoading}
          dateFieldName="date"
          showColumns={[
            {
              name: 'projectName',
              type: 'normal',
              displayName: 'Project Name',
            },
            {
              name: 'dailyBotFee',
              type: 'price',
              displayName: 'Daily Bot Fee',
            },
            {
              name: 'numberOfBots',
              type: 'normal',
              displayName: 'Number of bots',
            },
            { name: 'totalFee', type: 'price', displayName: 'Total fee' },
            { name: 'percentage', type: 'percent', displayName: 'Your %' },
            { name: 'earnings', type: 'price', displayName: 'Earnings' },
            // { name: 'date', type: 'time', displayName: 'Date' },
          ]}
          showSearchInput={false}
          showCheckbox={false}
          showPagination={true}
          showDateRange={true}
          showDateButtons={true}
          showDownloadButton={false}
          showTableHeaderInVertical={true}
          showTitleSideByside={false}
          showDataTablist={true}
          dataTabs={[
            { value: 'bots', label: 'Bots Fees' },
            { value: 'volume', label: 'Volume Fees' },
            { value: 'liquidation', label: 'Liquidation Fees' },
          ]}
          selectedDataTabButton={selectedFeeType}
          handleDataTabChange={(value) => setSelectedFeeType(value as any)}
          dateRange={feeDateRange}
          onDateRangeChange={setFeeDateRange}
          title="Detailed Fee Breakdown"
          description="How you commission is calculated from each project"
        />
      )}
    </motion.div>
  );
}
