'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { subDays, subWeeks } from 'date-fns';

import { PortfolioSummary } from '@/components/portfolio/portfolio-summary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { DataChart } from '@/components/ui/data-chart';
import { mockAmbassadorEarningsBreakdownData, mockPortfolioData, mockPortfolioProjects } from '@/lib/mock-data';
import { DataTable } from '@/components/ui/data-table';
import { motion } from 'framer-motion';

export default function PortfolioPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subWeeks(new Date(), 1),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  return (
    <motion.div
      className="p-4 md:p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
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

          {/* <PortfolioFilters
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          /> */}
        </div>

        <TabsContent value="overview">
          <motion.div
            className="space-y-4 md:space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PortfolioSummary dateRange={dateRange} />
            <div className="w-full h-full">
              <DataChart
                title="Portfolio Performance"
                description="Combined metrics across all projects"
                data={mockPortfolioProjects}
                yKey="trades"
                xKey="lastUpdated"
                color="hsl(var(--chart-1))"
                showDateRange={true}
                showDateButtons={true} 
                showChartTypeSelector={true}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>
          </motion.div>
          {/* <PortfolioProjects dateRange={dateRange} /> */}
        </TabsContent>

        <TabsContent value="profit" className="space-y-4">
          <motion.div
            className="w-full h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DataChart
              title="Profit Trend"
              description="Daily profit across all projects"
              data={mockPortfolioProjects}
              yKey="trades"
              xKey="lastUpdated"
              color="hsl(var(--chart-1))"
              showDateRange={true}
              showDateButtons={true} 
              showChartTypeSelector={true}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </motion.div>
          {/* <PortfolioProjects dateRange={dateRange} sortBy="profit" /> */}
        </TabsContent>

        <TabsContent value="volume" className="space-y-4">
          <motion.div
            className="w-full h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DataChart
              title="Trading Volume"
              description="Daily trading volume across all projects"
              data={mockPortfolioProjects}
              yKey="trades"
              xKey="lastUpdated"
              color="hsl(var(--chart-1))"
              showDateRange={true}
              showDateButtons={true} 
              showChartTypeSelector={true}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </motion.div>
          {/* <PortfolioProjects dateRange={dateRange} sortBy="volume" /> */}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <motion.div
            className="w-full h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DataChart
              title="Trading Activity"
              description="Number of trades executed"
              data={mockPortfolioProjects}
              yKey="trades"
              xKey="lastUpdated"
              color="hsl(var(--chart-1))"
              showDateRange={true}
              showDateButtons={true} 
              showChartTypeSelector={true}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </motion.div>
          {/* <PortfolioProjects dateRange={dateRange} sortBy="activity" /> */}
        </TabsContent>
        <DataTable
            title="Project Performance"
            description=""
            data={mockPortfolioProjects}
            dateFieldName="lastUpdated"
            showColumns={[
              { name: 'name', type: 'normal', displayName: 'Project'},
              { name: 'status', type: 'status', displayName: 'Status' },
              { name: 'network', type: 'normal', displayName: 'Network' },
              { name: 'profit', type: 'price', child : { name: 'profitChange', type: 'percent' }, sort: true },
              { name: 'volume', type: 'price', child : { name: 'volumeChange', type: 'percent' }, sort: true  },
              { name: 'trades', type: 'normal', child : { name: 'tradesChange', type: 'percent' }, sort: true  },
              { name: 'profitTrend', type: 'graph', displayName: 'Trend' },
              { name: 'id', type: 'link', displayName: 'Action', linkPrefix: 'projects/' },
            ]}
            showSearchInput={true}
            showCheckbox={true}
            showPagination={true}
            showDateRange={true}
            showDateButtons={true}
            showDownloadButton={true}
            showTableHeaderInVertical={true}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
      </Tabs>
    </motion.div>
  );
}
