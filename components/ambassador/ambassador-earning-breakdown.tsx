'use client';

import { DataTable, type TableTab } from '@/components/ui/data-table';
import { DataChart } from '@/components/ui/data-chart';
import { mockAmbassadorEarningsBreakdownData } from '@/lib/mock-data';


const tabOptions: TableTab[] = [
  { label: 'Bot Fees', value: 'bot' },
  { label: 'Volume Fees', value: 'volume' },
  { label: 'Liquidation Fee', value: 'liquidation' }
];

export function AmbassadorEarningBreakdown() {
  return (
    <div className="space-y-6">
      <DataChart
        title="Daily Earnings Breakdown"
        description="Your earnings split by fee type"
        data={mockAmbassadorEarningsBreakdownData}
        dataKey="numberOfBots"
        color="hsl(var(--chart-1))"
        showDateRange={true}
        showDateButtons={true} 
        showChartTypeSelector={true}
      />

      <DataTable
        data={mockAmbassadorEarningsBreakdownData}
        tabOptions={tabOptions}
        filterOption=""
        showSearchInput={false}
        showCheckbox={false}
        showPagination={true}
        showDateRange={true}
        showDateButtons={true}
        showDownloadButton={false}
        showTableHeaderInVertical={false}
        title="Detailed Fee Breakdown"
        description="How your commission is calculated from each project"
      />
    </div>
  );
} 