'use client';

import { DataTable, type TableTab } from '@/components/ui/data-table';
import { DataChart } from '@/components/ui/data-chart';
import { mockAmbassadorEarningsBreakdownData } from '@/lib/mock-data';
import { motion } from 'framer-motion';

export function AmbassadorEarningBreakdown() {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <DataChart
        title="Daily Earnings Breakdown"
        description="Your earnings split by fee type"
        data={mockAmbassadorEarningsBreakdownData}
        dataKey="numberOfBots"
        color="hsl(var(--chart-1))"
        showDateRange={true}
        showDateButtons={true} 
        showChartTypeSelector={true}
        showHeaderInVertical={false}
      />

      <DataTable
        data={mockAmbassadorEarningsBreakdownData}
        showColumns={[
          { name: 'projectName', type: 'normal', displayName: 'Project' },
          { name: 'dailyBotFee', type: 'price', displayName: 'Daily Fee' },
          { name: 'numberOfBots', type: 'price'},
          { name: 'percentage', type: 'percent', displayName: 'Percentage' },
          { name: 'earnings', type: 'price'},
          { name: 'date', type: 'time', displayName: 'Date' },
        ]}
        showSearchInput={true}
        showCheckbox={true}
        showPagination={true} 
        showDateRange={true}
        showDateButtons={true}
        showDownloadButton={true}
        showTableHeaderInVertical={true}
        title="Your Referrals"
        description="Track all projects you've referred to Valmira"
      />
    </motion.div>
  );
} 