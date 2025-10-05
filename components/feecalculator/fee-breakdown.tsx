// valmira-frontend/src/components/feecalculator/fee-breakdown.tsx
// (No changes needed, as it relies on botConfigs and globalFees props passed from FeeCalculator)
'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { GlobalFeeConfig } from '@/services/feeService';
import type {
  BotConfig,
  BotType,
  CalculatorState,
  FeeCalculation,
} from '@/types/fee-calculator';

interface FeeBreakdownProps {
  calculations: FeeCalculation;
  selectedBots: BotType[];
  botConfigs: BotConfig[]; // This now contains dynamic fee values AND UI metadata
  _projectCount?: number;
  globalFees?: GlobalFeeConfig;
  botInputs: CalculatorState['botInputs'];
}

export function FeeBreakdown({
  calculations,
  selectedBots,
  botConfigs,
  _projectCount = 1,
  botInputs,
}: FeeBreakdownProps) {
  if (selectedBots.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">
              Select at least one bot to see the fee breakdown
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="!pt-2 !px-2 !h-full ">
        <Table className="!h-full">
          <TableHeader className="pt-2-">
            <TableRow>
              <TableHead className="w-[300px] !text-sm !font-medium">
                Fee Type
              </TableHead>
              <TableHead className="!text-sm ">Description</TableHead>
              <TableHead className="text-right !text-sm ">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="!h-full !overflow-y-auto">
            {calculations.setupFee > 0 && (
              <TableRow>
                <TableCell className="!text-sm !font-medium">
                  Setup Fee
                </TableCell>
                <TableCell className="!text-sm ">
                  One-time setup fee (amortized monthly)
                </TableCell>
                <TableCell className="text-right !text-sm ">
                  {formatCurrency(calculations.setupFee / 12)}
                </TableCell>
              </TableRow>
            )}

            {selectedBots.map((botId) => {
              const bot = botConfigs.find((b) => b.id === botId)!;
              const activeDaysInput = bot.inputFields.find(
                (field) => field.id === 'activeDaysPerMonth'
              );
              const activeDays =
                activeDaysInput &&
                botInputs[botId as BotType]?.[activeDaysInput.id] !== undefined
                  ? (botInputs[botId as BotType][activeDaysInput.id] as number)
                  : activeDaysInput?.default || 30;

              return (
                <TableRow key={`${botId}-daily`}>
                  <TableCell className="!text-sm !font-medium">
                    {bot.name} Daily Fee
                  </TableCell>
                  <TableCell className="!text-sm ">
                    ${bot.dailyFee}/day × {activeDays} days
                  </TableCell>
                  <TableCell className="text-right !text-sm ">
                    {formatCurrency(bot.dailyFee * activeDays)}
                  </TableCell>
                </TableRow>
              );
            })}

            {calculations.performanceFees.map((fee, index) => {
              const bot = botConfigs.find((b) => b.id === fee.botId)!;

              return (
                <TableRow key={`${fee.botId}-performance-${index}`}>
                  <TableCell className="!text-sm !font-medium">
                    {bot.name} Performance Fee
                  </TableCell>
                  <TableCell className="!text-sm ">{fee.description}</TableCell>
                  <TableCell className="text-right !text-sm ">
                    {formatCurrency(fee.feeAmount)}
                  </TableCell>
                </TableRow>
              );
            })}

            <TableRow className="bg-muted/50">
              <TableCell className="!text-sm !font-medium">
                Total Monthly Cost
              </TableCell>
              <TableCell className="!text-sm ">
                Sum of all monthly fees
              </TableCell>
              <TableCell className="text-right !text-sm ">
                {formatCurrency(calculations.totalMonthlyFees)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="!text-sm !font-medium">
                Total Annual Cost
              </TableCell>
              <TableCell className="!text-sm ">
                Projected annual cost based on current settings
              </TableCell>
              <TableCell className="text-right !text-sm ">
                {formatCurrency(calculations.totalAnnualFees)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
