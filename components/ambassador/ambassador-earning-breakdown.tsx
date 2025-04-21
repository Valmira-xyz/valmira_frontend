'use client';

import { type DateRange } from 'react-day-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PortfolioChart } from '@/components/portfolio/portfolio-chart';

interface AmbassadorEarningBreakdownProps {
  dateRange?: DateRange;
}

const detailedFeeData = [
  {
    projectName: 'PEPE',
    dailyBotFee: '$1232',
    numberOfBots: 3,
    totalFee: '$12.22',
    percentage: '10%',
    earnings: '$123.22'
  },
  {
    projectName: 'SHIB',
    dailyBotFee: '$1232',
    numberOfBots: 2,
    totalFee: '$12.22',
    percentage: '10%',
    earnings: '$123.22'
  },
  {
    projectName: 'DOGE',
    dailyBotFee: '$1232',
    numberOfBots: 4,
    totalFee: '$12.22',
    percentage: '10%',
    earnings: '$123.22'
  },
  {
    projectName: 'MetaToken',
    dailyBotFee: '$1232',
    numberOfBots: 1,
    totalFee: '$12.22',
    percentage: '10%',
    earnings: '$123.22'
  },
  {
    projectName: 'GameFi',
    dailyBotFee: '1/15/2024',
    numberOfBots: 0,
    totalFee: '$12.22',
    percentage: '10%',
    earnings: '$123.22'
  }
];

export function AmbassadorEarningBreakdown({ dateRange }: AmbassadorEarningBreakdownProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily Earnings Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">Your earnings split by fee type</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Tabs defaultValue="1D" className="w-fit">
                <TabsList>
                  <TabsTrigger value="1D">1D</TabsTrigger>
                  <TabsTrigger value="1W">1W</TabsTrigger>
                  <TabsTrigger value="1M">1M</TabsTrigger>
                  <TabsTrigger value="1Y">1Y</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline">Oct 7th, 2024 - Nov 11th, 2024</Button>
              <Tabs defaultValue="Line" className="w-fit">
                <TabsList>
                  <TabsTrigger value="Line">Line</TabsTrigger>
                  <TabsTrigger value="Bar">Bar</TabsTrigger>
                  <TabsTrigger value="Area">Area</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="">
              <PortfolioChart 
                dateRange={dateRange}
                metric="profit"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Fee Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">How your commission is calculated from each project</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Tabs defaultValue="bot" className="w-fit">
                <TabsList>
                  <TabsTrigger value="bot">Bot Fees</TabsTrigger>
                  <TabsTrigger value="volume">Volume Fees</TabsTrigger>
                  <TabsTrigger value="liquidation">Liquidation Fee</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                <Button variant="outline">Oct 7th, 2024 - Nov 11th, 2024</Button>
                <Tabs defaultValue="1D" className="w-fit">
                  <TabsList>
                    <TabsTrigger value="1D">1D</TabsTrigger>
                    <TabsTrigger value="1W">1W</TabsTrigger>
                    <TabsTrigger value="1M">1M</TabsTrigger>
                    <TabsTrigger value="1Y">1Y</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Daily Bot Fee</TableHead>
                  <TableHead>Number of bots</TableHead>
                  <TableHead>Total fee</TableHead>
                  <TableHead>Your %</TableHead>
                  <TableHead>Your earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedFeeData.map((row) => (
                  <TableRow key={row.projectName}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>{row.projectName}</TableCell>
                    <TableCell>{row.dailyBotFee}</TableCell>
                    <TableCell>{row.numberOfBots}</TableCell>
                    <TableCell>{row.totalFee}</TableCell>
                    <TableCell>{row.percentage}</TableCell>
                    <TableCell>{row.earnings}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                0 of {detailedFeeData.length} row(s) selected.
              </div>
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">Previous page</span>
                    Previous
                  </Button>
                  <div className="flex items-center justify-center text-sm font-medium">
                    Page 1 of 3
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">Next page</span>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 