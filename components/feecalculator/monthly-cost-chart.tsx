// valmira-frontend/src/components/feecalculator/monthly-cost-chart.tsx
// (No changes needed, as it relies on botConfigs and _globalFees props passed from FeeCalculator)
'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { GlobalFeeConfig } from '@/services/feeService';
import type {
  BotConfig,
  BotType,
  FeeCalculation,
} from '@/types/fee-calculator';

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  category: string;
}

interface MonthlyCostChartProps {
  calculations: FeeCalculation;
  selectedBots: BotType[];
  botConfigs: BotConfig[]; // This now contains dynamic fee values AND UI metadata
  _projectCount?: number;
  globalFees?: GlobalFeeConfig;
}

export function MonthlyCostChart({
  calculations,
  selectedBots,
  botConfigs,
  _projectCount = 1,
}: MonthlyCostChartProps) {
  if (selectedBots.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">
              Select at least one bot to see the cost visualization
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for the chart with specific colors from Figma
  const chartData: ChartDataItem[] = [
    {
      name: 'Liquidation Bot Daily Fee',
      value: selectedBots.includes('liquidation')
        ? (botConfigs.find((b) => b.id === 'liquidation')?.dailyFee || 0) * 30
        : 0,
      color: '#00B2A9', // Teal
      category: 'liquidation_daily',
    },
    {
      name: 'Volume Bot Daily Fee',
      value: selectedBots.includes('volume')
        ? (botConfigs.find((b) => b.id === 'volume')?.dailyFee || 0) * 30
        : 0,
      color: '#FF6B35', // Reddish-orange
      category: 'volume_daily',
    },
    {
      name: 'Bundle Snipe Bot Daily Fee',
      value: selectedBots.includes('bundle-snipe')
        ? (botConfigs.find((b) => b.id === 'bundle-snipe')?.dailyFee || 0) * 30
        : 0,
      color: '#A06CD5', // Example color for new bot daily fee (Purple)
      category: 'bundle_snipe_daily',
    },
    {
      name: 'Distribution Bot Daily Fee',
      value: selectedBots.includes('distribution')
        ? (botConfigs.find((b) => b.id === 'distribution')?.dailyFee || 0) * 30
        : 0,
      color: '#5C8C80', // Example color for new bot daily fee (Sage Green)
      category: 'distribution_daily',
    },

    {
      name: 'Liquidation Bot Performance Fee',
      value:
        calculations.performanceFees.find((fee) => fee.botId === 'liquidation')
          ?.feeAmount || 0,
      color: '#F79D5C', // Peachy-orange
      category: 'liquidation_performance',
    },
    {
      name: 'Volume Bot Performance Fee',
      value:
        calculations.performanceFees.find((fee) => fee.botId === 'volume')
          ?.feeAmount || 0,
      color: '#F7C46C', // Yellow
      category: 'volume_performance',
    },
    {
      name: 'Bundle Snipe Bot Performance Fee',
      value:
        calculations.performanceFees.find((fee) => fee.botId === 'bundle-snipe')
          ?.feeAmount || 0,
      color: '#D89614', // Example color for new bot performance fee (Goldenrod)
      category: 'bundle_snipe_performance',
    },
    {
      name: 'Distribution Bot Performance Fee',
      value:
        calculations.performanceFees.find((fee) => fee.botId === 'distribution')
          ?.feeAmount || 0,
      color: '#6F9E3F', // Example color for new bot performance fee (Lime Green)
      category: 'distribution_performance',
    },
    // Setup Fee - if it contributes to monthly cost after amortization
    {
      name: 'Setup Fee (Amortized)',
      value: calculations.setupFee > 0 ? calculations.setupFee / 12 : 0, // Use the already calculated amortized setup fee
      color: '#8A848D', // Grey
      category: 'setup_fee',
    },
  ].filter((item) => item.value > 0) as ChartDataItem[]; // Remove any zero-value items

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row h-[400px] gap-2">
          <div className="h-full w-full md:w-3/5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `${formatCurrency(Number(value))}`,
                    'Amount',
                  ]}
                  labelFormatter={(label) => label}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-2/5 flex items-center justify-center pl-2">
            <div className="grid grid-cols-2 gap-2 w-full">
              {chartData.map((entry, index) => (
                <div
                  key={`legend-${index}`}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-[11px] truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
