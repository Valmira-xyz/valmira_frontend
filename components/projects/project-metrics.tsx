import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Bot, ChartColumnIncreasing, Droplet, TrendingUp } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { projectService } from '@/services/projectService';
import { getPoolInfo } from '@/services/web3Utils';
import websocketService, { WebSocketEvents } from '@/services/websocketService';
import { fetchNativeCurrencyPrice } from '@/store/slices/projectSlice';
import { AppDispatch, RootState } from '@/store/store';
import { ProjectWithAddons } from '@/types';

interface ProjectMetricsProps {
  project: ProjectWithAddons;
  loading: boolean;
}

export function ProjectMetrics({ project, loading }: ProjectMetricsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const nativeCurrencyPrice = useSelector(
    (state: RootState) => state.projects.nativeCurrencyPrice
  );
  const nativeCurrencyLoading = useSelector(
    (state: RootState) => state.projects.nativeCurrencyLoading
  );

  // Define all state and refs at the top
  const [poolLiquidity, setPoolLiquidity] = useState<number>(0);
  const [loadingLiquidity, setLoadingLiquidity] = useState<boolean>(false);
  const [localMetrics, setLocalMetrics] = useState<ProjectMetrics | null>(null);
  const [animatedMetrics, setAnimatedMetrics] = useState({
    cumulativeProfit: 0,
    tradingVolume: 0,
    activeBots: 0,
    liquidity: 0,
  });

  const hasInitialAnimation = useRef(false);
  const isFetchingNativePrice = useRef(false);
  const hasInitialNativePriceFetch = useRef(false);
  const isCalculatingLiquidity = useRef(false);

  // Define a type for the metrics object
  type ProjectMetrics = {
    cumulativeProfit: number;
    tradingVolume: number;
    activeBots: number;
    [key: string]: any; // Allow other properties
  };

  // Calculate active bots count
  const calculateActiveBots = useCallback((): number => {
    if (!project?.addons) return 0;

    let activeBots = 0;
    if (project.addons.SnipeBot?.isEnabled) activeBots += 1;
    if (project.addons.VolumeBot?.isEnabled) activeBots += 1;
    if (project.addons.HolderBot?.isEnabled) activeBots += 1;
    return activeBots;
  }, [project?.addons]);

  // Query for project stats
  const { data: projectStats } = useQuery({
    queryKey: ['projectStats', project?._id, 'all'],
    queryFn: () =>
      project?._id
        ? projectService.getProjectStats(project._id, {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date(),
          })
        : Promise.resolve(null),
    enabled: !!project?._id,
  });

  // Update the metrics handler
  const handleMetricsUpdate = useCallback(
    (data: any) => {
      if (data.projectId === project?._id && data.metrics) {
        const updatedMetrics = { ...data.metrics };
        if (!updatedMetrics.activeBots) {
          updatedMetrics.activeBots = calculateActiveBots();
        }
        setLocalMetrics(updatedMetrics);
      }
    },
    [project?._id, calculateActiveBots]
  );

  // Fetch native currency price
  const fetchNativePriceData = useCallback(async () => {
    if (
      isFetchingNativePrice.current ||
      (hasInitialNativePriceFetch.current && nativeCurrencyPrice)
    ) {
      return;
    }

    try {
      isFetchingNativePrice.current = true;
      await dispatch(fetchNativeCurrencyPrice());
      hasInitialNativePriceFetch.current = true;
    } catch (error) {
      console.error(
        '📊 [ProjectMetrics] Error fetching native currency price:',
        error
      );
    } finally {
      isFetchingNativePrice.current = false;
    }
  }, [dispatch, nativeCurrencyPrice]);

  // Calculate liquidity
  const calculateLiquidity = useCallback(async () => {
    const chainName = project?.chainName || 'BSC_MAINNET';
    const price =
      nativeCurrencyPrice[chainName as keyof typeof nativeCurrencyPrice];

    if (!project?.tokenAddress || !price || isCalculatingLiquidity.current) {
      return;
    }

    try {
      isCalculatingLiquidity.current = true;
      setLoadingLiquidity(true);

      const poolInfo = await getPoolInfo(project.tokenAddress, chainName);

      if (poolInfo) {
        const liquidityInUsd = poolInfo.nativeReserve * price * 2;
        setPoolLiquidity(liquidityInUsd);
      } else {
        setPoolLiquidity(0);
      }
    } catch (error) {
      console.error('📊 [ProjectMetrics] Failed to fetch liquidity:', error);
      setPoolLiquidity(0);
    } finally {
      setLoadingLiquidity(false);
      isCalculatingLiquidity.current = false;
    }
  }, [project?.tokenAddress, project?.chainName, nativeCurrencyPrice]);

  // Effects
  useEffect(() => {
    if (!project) return;

    const currentMetrics = {
      cumulativeProfit:
        localMetrics?.cumulativeProfit ??
        projectStats?.metrics?.cumulativeProfit ??
        project.metrics?.cumulativeProfit ??
        0,
      tradingVolume:
        localMetrics?.tradingVolume ??
        projectStats?.metrics?.tradingVolume ??
        project.metrics?.tradingVolume ??
        0,
      activeBots: localMetrics?.activeBots ?? calculateActiveBots(),
      liquidity: poolLiquidity,
    };

    if (
      !hasInitialAnimation.current &&
      !loading &&
      !loadingLiquidity &&
      !nativeCurrencyLoading
    ) {
      const timer = setTimeout(() => {
        setAnimatedMetrics(currentMetrics);
        hasInitialAnimation.current = true;
      }, 100);
      return () => clearTimeout(timer);
    } else if (hasInitialAnimation.current) {
      setAnimatedMetrics(currentMetrics);
    }
  }, [
    project,
    localMetrics,
    projectStats,
    poolLiquidity,
    loading,
    loadingLiquidity,
    nativeCurrencyLoading,
    calculateActiveBots,
  ]);

  useEffect(() => {
    if (!project?._id) return;

    websocketService.connect();
    websocketService.joinProject(project._id);
    websocketService.subscribe(
      WebSocketEvents.PROJECT_METRICS_UPDATED,
      handleMetricsUpdate
    );

    return () => {
      websocketService.unsubscribe(
        WebSocketEvents.PROJECT_METRICS_UPDATED,
        handleMetricsUpdate
      );
      websocketService.leaveProject(project._id);
    };
  }, [project?._id, handleMetricsUpdate]);

  useEffect(() => {
    fetchNativePriceData();
  }, [fetchNativePriceData]);

  useEffect(() => {
    if (nativeCurrencyPrice && project?.tokenAddress) {
      calculateLiquidity();
    }
  }, [nativeCurrencyPrice, project?.tokenAddress, calculateLiquidity]);

  // Early return for loading state
  if (!project || loading || loadingLiquidity || nativeCurrencyLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px] mb-2" />
              <Skeleton className="h-3 w-[140px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 !pb-2">
          <CardTitle className="text-sm font-medium">
            Cumulative Profit
          </CardTitle>
          <TrendingUp className="h-4 w-4" />
        </CardHeader>
        <CardContent className="!pt-0">
          <div className="text-xl font-bold">
            <NumberFlow
              className="font-tt"
              value={animatedMetrics.cumulativeProfit}
              locales={'en-US'}
              format={{
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Total profit since inception
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 !pb-2">
          <CardTitle className="text-sm font-medium">
            Cumulative Volume
          </CardTitle>
          <ChartColumnIncreasing className="h-4 w-4" />
        </CardHeader>
        <CardContent className="!pt-0">
          <div className="text-xl font-bold">
            <NumberFlow
              className="font-tt"
              value={animatedMetrics.tradingVolume}
              locales={'en-US'}
              format={{
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Trading volume since inception
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 !pb-2">
          <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
          <Bot className="h-4 w-4" />
        </CardHeader>
        <CardContent className="!pt-0">
          <div className="text-xl font-bold">
            <NumberFlow
              className="font-tt"
              value={animatedMetrics.activeBots}
              locales={'en-US'}
              format={{
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Currently active trading bots
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 !pb-2">
          <CardTitle className="text-sm font-medium">Liquidity</CardTitle>
          <Droplet className="h-4 w-4" />
        </CardHeader>
        <CardContent className="!pt-0">
          <div className="text-xl font-bold">
            <NumberFlow
              className="font-tt"
              locales={'en-US'}
              value={animatedMetrics.liquidity}
              format={{
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Total available liquidity
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
