import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import NumberFlow from '@number-flow/react';

import { Bot, ChartColumnIncreasing, Droplet, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getPoolInfo } from '@/services/web3Utils';
import websocketService, { WebSocketEvents } from '@/services/websocketService';
import { fetchBnbPrice } from '@/store/slices/projectSlice';
import { AppDispatch, RootState } from '@/store/store';
import { ProjectWithAddons } from '@/types';

export function ProjectMetrics({ project }: { project: ProjectWithAddons }) {
  const dispatch = useDispatch<AppDispatch>();
  const { projectStats, loading, bnbPrice, bnbPriceLoading } = useSelector(
    (state: RootState) => state.projects
  );
  const [poolLiquidity, setPoolLiquidity] = useState<number>(0);
  const [loadingLiquidity, setLoadingLiquidity] = useState<boolean>(false);
  const [localMetrics, setLocalMetrics] = useState<ProjectMetrics | null>(null);
  const [animatedMetrics, setAnimatedMetrics] = useState({
    cumulativeProfit: 0,
    tradingVolume: 0,
    activeBots: 0,
    liquidity: 0
  });
  const hasInitialAnimation = useRef(false);
  const isFetchingBnbPrice = useRef(false);
  const hasInitialBnbPriceFetch = useRef(false);
  const isCalculatingLiquidity = useRef(false);

  // Define a type for the metrics object
  type ProjectMetrics = {
    cumulativeProfit: number;
    tradingVolume: number;
    activeBots: number;
    [key: string]: any; // Allow other properties
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Calculate active bots count similar to dashboard-metrics.tsx
  const calculateActiveBots = (): number => {
    let activeBots = 0;

    // Count active bots from addons
    if (project.addons) {
      // SnipeBot
      if (project.addons.SnipeBot?.isEnabled) {
        activeBots += 1;
      }

      // VolumeBot
      if (project.addons.VolumeBot?.isEnabled) {
        activeBots += 1;
      }

      // HolderBot
      if (project.addons.HolderBot?.isEnabled) {
        activeBots += 1;
      }
    }

    return activeBots;
  };

  // Update the metrics handler to use animated transitions
  const handleMetricsUpdate = useCallback(
    (data: any) => {
      if (data.projectId === project._id && data.metrics) {
        const updatedMetrics = { ...data.metrics };
        if (!updatedMetrics.activeBots) {
          updatedMetrics.activeBots = calculateActiveBots();
        }
        setLocalMetrics(updatedMetrics);
      }
    },
    [project._id, calculateActiveBots]
  );

  // Single effect to handle both initial animation and updates
  useEffect(() => {
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

    if (!hasInitialAnimation.current && !loading && !loadingLiquidity && !bnbPriceLoading) {
      // Initial animation
      const timer = setTimeout(() => {
        setAnimatedMetrics(currentMetrics);
        hasInitialAnimation.current = true;
      }, 100);
      return () => clearTimeout(timer);
    } else if (hasInitialAnimation.current) {
      // Regular updates
      setAnimatedMetrics(currentMetrics);
    }
  }, [localMetrics, poolLiquidity, loading, loadingLiquidity, bnbPriceLoading]);

  // Connect to WebSocket and subscribe to project updates
  useEffect(() => {
    if (!project?._id) {
      console.warn(
        '📊 [ProjectMetrics] No project ID available for WebSocket connection'
      );
      return;
    }

    console.log('📊 [ProjectMetrics] Setting up WebSocket connection:', {
      projectId: project._id,
      timestamp: new Date().toISOString(),
    });

    // Ensure connection and join project room
    websocketService.connect();
    websocketService.joinProject(project._id);

    // Subscribe to metrics updates
    websocketService.subscribe(
      WebSocketEvents.PROJECT_METRICS_UPDATED,
      handleMetricsUpdate
    );

    // Cleanup on unmount
    return () => {
      if (project._id) {
        console.log('📊 [ProjectMetrics] Cleaning up WebSocket connection:', {
          projectId: project._id,
          timestamp: new Date().toISOString(),
        });
        websocketService.unsubscribe(
          WebSocketEvents.PROJECT_METRICS_UPDATED,
          handleMetricsUpdate
        );
        websocketService.leaveProject(project._id);
      }
    };
  }, [project?._id, handleMetricsUpdate]);

  // Fetch BNB price with debounce mechanism
  const fetchBnbPriceData = useCallback(async () => {
    // Skip if fetch is already in progress or we've already fetched and have data
    if (
      isFetchingBnbPrice.current ||
      (hasInitialBnbPriceFetch.current && bnbPrice)
    ) {
      console.log('📊 [ProjectMetrics] Skipping BNB price fetch:', {
        isFetching: isFetchingBnbPrice.current,
        hasInitialFetch: hasInitialBnbPriceFetch.current,
        currentPrice: bnbPrice,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      console.log('📊 [ProjectMetrics] Fetching BNB price');
      isFetchingBnbPrice.current = true;
      await dispatch(fetchBnbPrice());
      hasInitialBnbPriceFetch.current = true;
      console.log('📊 [ProjectMetrics] BNB price fetched successfully:', {
        price: bnbPrice,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('📊 [ProjectMetrics] Error fetching BNB price:', {
        error,
        timestamp: new Date().toISOString(),
      });
    } finally {
      isFetchingBnbPrice.current = false;
    }
  }, [dispatch, bnbPrice]);

  useEffect(() => {
    fetchBnbPriceData();
  }, [fetchBnbPriceData]);

  // Calculate liquidity with fetch tracking
  const calculateLiquidity = useCallback(async () => {
    const tokenAddress = project.tokenAddress;
    if (!tokenAddress || !bnbPrice || isCalculatingLiquidity.current) {
      console.log('📊 [ProjectMetrics] Skipping liquidity calculation:', {
        hasTokenAddress: !!tokenAddress,
        hasBnbPrice: !!bnbPrice,
        isCalculating: isCalculatingLiquidity.current,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      console.log('📊 [ProjectMetrics] Calculating liquidity for token:', {
        tokenAddress,
        bnbPrice,
        timestamp: new Date().toISOString(),
      });
      isCalculatingLiquidity.current = true;
      setLoadingLiquidity(true);

      const poolInfo = await getPoolInfo(tokenAddress);
      if (poolInfo) {
        // Calculate liquidity in USD using the BNB price from Redux
        const liquidityInUsd = poolInfo.bnbReserve * bnbPrice * 2; // Times 2 because liquidity is balanced
        console.log('📊 [ProjectMetrics] Liquidity calculated:', {
          bnbReserve: poolInfo.bnbReserve,
          bnbPrice,
          liquidityUsd: liquidityInUsd,
          timestamp: new Date().toISOString(),
        });
        setPoolLiquidity(liquidityInUsd);
      } else {
        console.warn('📊 [ProjectMetrics] No pool info available for token:', {
          tokenAddress,
          timestamp: new Date().toISOString(),
        });
        setPoolLiquidity(0);
      }
    } catch (error) {
      console.error('📊 [ProjectMetrics] Failed to fetch liquidity:', {
        error,
        tokenAddress,
        timestamp: new Date().toISOString(),
      });
      setPoolLiquidity(0);
    } finally {
      setLoadingLiquidity(false);
      isCalculatingLiquidity.current = false;
    }
  }, [project.tokenAddress, bnbPrice]);

  useEffect(() => {
    if (bnbPrice && project.tokenAddress) {
      calculateLiquidity();
    }
  }, [bnbPrice, project.tokenAddress, calculateLiquidity, localMetrics]);

  if (loading || loadingLiquidity || bnbPriceLoading) {
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Cumulative Profit
          </CardTitle>
          <TrendingUp className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            <NumberFlow 
              value={animatedMetrics.cumulativeProfit}
              format={{
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Total profit since inception
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Cumulative Volume
          </CardTitle>
          <ChartColumnIncreasing className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            <NumberFlow 
              value={animatedMetrics.tradingVolume}
              format={{
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Trading volume since inception
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
          <Bot className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            <NumberFlow 
              value={animatedMetrics.activeBots}
              format={{
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Currently active trading bots
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Liquidity</CardTitle>
          <Droplet className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            <NumberFlow 
              value={animatedMetrics.liquidity}
              format={{
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
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
