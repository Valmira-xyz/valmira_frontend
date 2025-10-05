export type BotType =
  | 'liquidation'
  | 'volume'
  | 'bundle-snipe'
  | 'distribution';

export interface BotConfig {
  id: string;
  name: string;
  description: string;
  dailyFee: number;
  performanceFeeOptions: {
    type: 'profit' | 'volume' | 'tokens' | 'flat';
    value: number;
    description: string;
  }[];
  defaultPerformanceFeeOption: number;
  inputFields: {
    id: string;
    label: string;
    type: 'number' | 'slider' | 'select';
    prefix?: string;
    suffix?: string;
    default: number;
    min?: number;
    max?: number;
    options?: { value: number; label: string }[];
    tooltip: string;
  }[];
}

export interface CalculatorState {
  selectedBots: BotType[];
  botInputs: {
    [key in BotType]: {
      [key: string]: number;
    };
  };
  performanceFeeOptions: {
    [key in BotType]: number;
  };
  projectCount: number;
  calculations: FeeCalculation;
}

export interface FeeCalculation {
  setupFee: number;
  dailyFees: number;
  monthlyDailyFees: number;
  performanceFees: {
    botId: BotType;
    feeAmount: number;
    feePercentage: number;
    description: string;
  }[];
  totalMonthlyFees: number;
  totalAnnualFees: number;
  savingsFromEarlyAdoption: number;
  totalMonthlyFeesAllProjects: number;
  totalAnnualFeesAllProjects: number;
}
