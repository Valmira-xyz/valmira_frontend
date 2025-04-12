import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

// Mock data for demonstration
const mockData = {
  dailyTradingVolume: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2025, 1, i + 1),
    volume: Math.random() * 1000000 + 500000,
  })),
  marketShare: [
    { name: 'Market Maker', value: 79.31, label: '79.31%' },
    { name: 'Organic Market', value: 20.69, label: '20.69%' },
  ],
  organicTokens: [
    { name: 'Buy', value: 51.41, amount: '224.69M', label: '51.41%' },
    { name: 'Sell', value: 48.59, amount: '212.38M', label: '48.59%' },
  ],
  dailyTokens: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2025, 1, i + 1),
    buy: Math.random() * 100,
    sell: Math.random() * 100,
  })),
  paidFees: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2025, 1, i + 1),
    fees: Math.random() * 5,
  })),
  liquidityPool: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2025, 1, i + 1),
    sol: Math.random() * 1000 + 200,
    ramon: Math.random() * 1000 + 200,
  })),
};

const COLORS = {
  // Main theme colors
  primary: '#4B7BF5', // Main blue
  secondary: '#A8C5FF', // Light blue
  accent: '#64748b', // Grey blue
  success: '#22c55e', // Green
  danger: '#ef4444', // Red
  warning: '#f59e0b', // Orange

  // Chart specific colors
  chart: {
    area: {
      stroke: '#4B7BF5',
      fill: '#4B7BF5',
      fillOpacity: 0.1,
    },
    pie: {
      primary: '#4B7BF5',
      secondary: '#A8C5FF',
    },
    liquidityPool: {
      sol: {
        stroke: '#4B7BF5',
        fill: '#4B7BF5',
        fillOpacity: 0.1,
      },
      ramon: {
        stroke: '#A8C5FF',
        fill: '#A8C5FF',
        fillOpacity: 0.1,
      },
    },
  },
};

const CustomLabel = (props: any) => {
  const { cx, cy, value, name, percent } = props;
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#ffffff"
      fontSize="14"
      stroke="#000000"
      strokeWidth="2"
      paintOrder="stroke"
      filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.3))"
    >
      {`${(percent * 100).toFixed(2)}%`}
    </text>
  );
};

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
      {/* Daily Total Traded Volume USD */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Total Traded Volume USD</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData.dailyTradingVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(date, 'MMM dd')}
                />
                <YAxis tickFormatter={(value) => `$${formatNumber(value)}`} />
                <Tooltip
                  formatter={(value: any) => [
                    `$${formatNumber(value)}`,
                    'Volume',
                  ]}
                  labelFormatter={(label) =>
                    format(label as Date, 'MMM dd, yyyy')
                  }
                />
                <Area type="monotone" dataKey="volume" {...COLORS.chart.area} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Tokens Bought & Sold</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData.dailyTokens}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(date, 'MMM dd')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) =>
                    format(label as Date, 'MMM dd, yyyy')
                  }
                />
                <Bar dataKey="buy" fill={COLORS.chart.pie.primary} name="Buy" />
                <Bar
                  dataKey="sell"
                  fill={COLORS.chart.pie.secondary}
                  name="Sell"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Organic Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Organic Tokens Bought & Sold</CardTitle>
          <div className="flex justify-between mt-2">
            <div>
              <div className="text-sm text-muted-foreground">Buy</div>
              <div className="text-lg font-semibold">
                {mockData.organicTokens[0].amount}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Sell</div>
              <div className="text-lg font-semibold">
                {mockData.organicTokens[1].amount}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockData.organicTokens}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill={COLORS.chart.pie.primary}
                  label={CustomLabel}
                  labelLine={false}
                >
                  {mockData.organicTokens.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0
                          ? COLORS.chart.pie.primary
                          : COLORS.chart.pie.secondary
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Paid Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Paid Fees BNB</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData.paidFees}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(date, 'MMM dd')}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => [`${value} BNB`, 'Fees']}
                  labelFormatter={(label) =>
                    format(label as Date, 'MMM dd, yyyy')
                  }
                />
                <Bar dataKey="fees" fill={COLORS.chart.pie.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Liquidity Pool */}
      <Card>
        <CardHeader>
          <CardTitle>Liquidity Pool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData.liquidityPool}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(date, 'MMM dd')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) =>
                    format(label as Date, 'MMM dd, yyyy')
                  }
                />
                <Area
                  type="monotone"
                  dataKey="sol"
                  name="SOL"
                  {...COLORS.chart.liquidityPool.sol}
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="ramon"
                  name="RAMON"
                  {...COLORS.chart.liquidityPool.ramon}
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Market Share */}
      <Card>
        <CardHeader>
          <CardTitle>Total Market Share</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockData.marketShare}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill={COLORS.chart.pie.primary}
                  label={CustomLabel}
                  labelLine={false}
                >
                  {mockData.marketShare.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0
                          ? COLORS.chart.pie.primary
                          : COLORS.chart.pie.secondary
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
