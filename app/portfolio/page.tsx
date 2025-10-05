'use client';

import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { subWeeks } from 'date-fns';
import { motion } from 'framer-motion';

import { PortfolioSummary } from '@/components/portfolio/portfolio-summary';
import { DataChart } from '@/components/ui/data-chart';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { projectService } from '@/services/projectService';

export default function PortfolioPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subWeeks(new Date(), 1),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [profitTrend, setProfitTrend] = useState<any>(null);
  const [volumeTrend, setVolumeTrend] = useState<any>(null);
  const [botPerformance, setBotPerformance] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [globalMetrics, setGlobalMetrics] = useState<any>(null);
  const [projectStats, setProjectStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjectStats, setIsLoadingProjectStats] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGlobalMetrics();
  }, []);

  useEffect(() => {
    fetchProjectStats();
  }, [dateRange]);

  useEffect(() => {
    switch (activeTab) {
      case 'profit':
        fetchProfitTrend();
        break;
      case 'volume':
        fetchVolumeTrend();
        break;
      case 'activity':
        fetchRecentActivity();
        break;
      case 'overview':
      default:
        fetchBotPerformance();
        break;
    }
  }, [activeTab, dateRange]);

  const fetchProjectStats = async () => {
    try {
      if (isLoadingProjectStats) return;
      setIsLoadingProjectStats(true);
      const data = await projectService.getGlobalProjectStats(
        dateRange?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dateRange?.to || new Date(Date.now())
      );

      console.log('project status data', data);
      setProjectStats(data as any[]);
    } catch (error: any) {
      console.error('Error fetching project stats:', error);
      toast({
        title:
          error.response?.data?.errorType || 'Error fetching project stats',
        description:
          error.response?.data?.errorMessage.slice(0, 200) ||
          'An unknown error occurred',
      });
    } finally {
      setIsLoadingProjectStats(false);
    }
  };

  const fetchGlobalMetrics = async () => {
    try {
      if (isLoading) return;
      setIsLoading(true);
      const data = await projectService.getGlobalMetrics();
      setGlobalMetrics(data);
    } catch (error: any) {
      console.error('Error fetching global metrics:', error);
      toast({
        title:
          error.response?.data?.errorType || 'Error fetching global metrics',
        description:
          error.response?.data?.errorMessage.slice(0, 200) ||
          'An unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfitTrend = async () => {
    try {
      if (isLoading) return;
      setIsLoading(true);
      const data = await projectService.getGlobalProfitTrending(
        dateRange?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dateRange?.to || new Date(Date.now())
      );
      setProfitTrend(data);
    } catch (error: any) {
      console.error('Error fetching profit trend:', error);
      toast({
        title: error.response?.data?.errorType || 'Error fetching profit trend',
        description:
          error.response?.data?.errorMessage.slice(0, 200) ||
          'An unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVolumeTrend = async () => {
    try {
      if (isLoading) return;
      setIsLoading(true);
      const data = await projectService.getGlobalVolumeTrending(
        dateRange?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dateRange?.to || new Date(Date.now())
      );
      setVolumeTrend(data);
    } catch (error: any) {
      console.error('Error fetching volume trend:', error);
      toast({
        title: error.response?.data?.errorType || 'Error fetching volume trend',
        description:
          error.response?.data?.errorMessage.slice(0, 200) ||
          'An unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBotPerformance = async () => {
    try {
      if (isLoading) return;
      setIsLoading(true);
      const data = await projectService.getGlobalBotPerformanceHistory(
        dateRange?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dateRange?.to || new Date(Date.now())
      );
      setBotPerformance(data);
    } catch (error: any) {
      console.error('Error fetching bot performance:', error);
      toast({
        title:
          error.response?.data?.errorType || 'Error fetching bot performance',
        description:
          error.response?.data?.errorMessage.slice(0, 200) ||
          'An unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      if (isLoading) return;
      setIsLoading(true);
      const data = await projectService.getGlobalRecentActivity(
        dateRange?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dateRange?.to || new Date(Date.now())
      );
      setRecentActivity(data);
    } catch (error: any) {
      console.error('Error fetching recent activity:', error);
      toast({
        title:
          error.response?.data?.errorType || 'Error fetching recent activity',
        description:
          error.response?.data?.errorMessage.slice(0, 200) ||
          'An unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <PortfolioSummary
              globalMetrics={globalMetrics}
              isLoading={isLoading}
            />
            <div className="w-full h-full">
              <DataChart
                title="Portfolio Performance"
                description="Combined metrics across all projects"
                data={botPerformance}
                yKey="trades"
                xKey="lastUpdated"
                color="hsl(var(--chart-1))"
                isLoading={isLoading}
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
              data={profitTrend}
              yKey="value"
              xKey="timestamp"
              color="hsl(var(--chart-1))"
              isLoading={isLoading}
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
              data={volumeTrend}
              yKey="value"
              xKey="timestamp"
              color="hsl(var(--chart-1))"
              isLoading={isLoading}
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
              data={recentActivity}
              yKey="value"
              xKey="timestamp"
              color="hsl(var(--chart-1))"
              isLoading={isLoading}
              showDateRange={true}
              showDateButtons={true}
              showChartTypeSelector={true}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </motion.div>
          {/* <PortfolioProjects dateRange={dateRange} sortBy="activity" /> */}
        </TabsContent>
        {/* <DataTable
          title="Project Performance"
          description=""
          data={projectStats}
          // data={mockPortfolioProjects}
          showColumns={[
            { name: 'name', type: 'normal', displayName: 'Project' },
            { name: 'status', type: 'status', displayName: 'Status' },
            { name: 'network', type: 'normal', displayName: 'Network' },
            {
              name: 'profit',
              type: 'price',
              child: { name: 'profitChange', type: 'percent' },
              sort: true,
            },
            {
              name: 'volume',
              type: 'price',
              child: { name: 'volumeChange', type: 'percent' },
              sort: true,
            },
            {
              name: 'trades',
              type: 'normal',
              child: { name: 'tradesChange', type: 'percent' },
              sort: true,
            },
            // { name: 'profitTrend', type: 'graph', displayName: 'Trend' },
            {
              name: 'id',
              type: 'link',
              displayName: 'Action',
              linkPrefix: 'projects/',
            },
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
          isLoading={isLoadingProjectStats}
        /> */}
      </Tabs>
    </motion.div>
  );
}
