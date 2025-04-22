'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { subDays } from 'date-fns';
import { Download } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { PortfolioChart } from '@/components/portfolio/portfolio-chart';
import { PortfolioFilters } from '@/components/portfolio/portfolio-filters';
import { PortfolioProjects } from '@/components/portfolio/portfolio-projects';
import { PortfolioSummary } from '@/components/portfolio/portfolio-summary';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { DataChart } from '@/components/ui/data-chart';
import { mockAmbassadorEarningsBreakdownData } from '@/lib/mock-data';

export default function PortfolioPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const handleExportData = () => {
    toast({
      title: 'Exporting data',
      description: 'Your portfolio data is being exported as CSV.',
    });
  };

  return (
    <div className="">
      <PageHeader title="Portfolio">
        <Button variant="outline" onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 md:space-y-6"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="profit">Profit</TabsTrigger>
              <TabsTrigger value="volume">Volume</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <PortfolioFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>

          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            <PortfolioSummary dateRange={dateRange} />
            <div className="w-full h-full">
              <DataChart
                title="Portfolio Performance"
                description="Combined metrics across all projects"
                data={mockAmbassadorEarningsBreakdownData}
                dataKey="numberOfBots"
                color="hsl(var(--chart-1))"
                showDateRange={true}
                showDateButtons={true} 
                showChartTypeSelector={true}
              />
            </div>
            <PortfolioProjects dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="profit" className="space-y-4">
            <div className="w-full h-full">
              <DataChart
                title="Profit Trend"
                description="Daily profit across all projects"
                data={mockAmbassadorEarningsBreakdownData}
                dataKey="numberOfBots"
                color="hsl(var(--chart-1))"
                showDateRange={true}
                showDateButtons={true} 
                showChartTypeSelector={true}
              />
            </div>
            <PortfolioProjects dateRange={dateRange} sortBy="profit" />
          </TabsContent>

          <TabsContent value="volume" className="space-y-4">
            <div className="w-full h-full">
              <DataChart
                title="Trading Volume"
                description="Daily trading volume across all projects"
                data={mockAmbassadorEarningsBreakdownData}
                dataKey="numberOfBots"
                color="hsl(var(--chart-1))"
                showDateRange={true}
                showDateButtons={true} 
                showChartTypeSelector={true}
              />
            </div>
            <PortfolioProjects dateRange={dateRange} sortBy="volume" />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="w-full h-full">
              <DataChart
                title="Trading Activity"
                description="Numberof trades executed"
                data={mockAmbassadorEarningsBreakdownData}
                dataKey="numberOfBots"
                color="hsl(var(--chart-1))"
                showDateRange={true}
                showDateButtons={true} 
                showChartTypeSelector={true}
              />
            </div>
            <PortfolioProjects dateRange={dateRange} sortBy="activity" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
