import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Project, ProjectWithAddons } from "@/types"
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from "@/store/store"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState, useRef, useCallback } from "react"
import { getPoolInfo } from "@/services/web3Utils"
import { fetchBnbPrice } from "@/store/slices/projectSlice"


export function ProjectMetrics({ project }: {project: ProjectWithAddons}) {
  const dispatch = useDispatch<AppDispatch>();
  const { projectStats, loading, bnbPrice, bnbPriceLoading } = useSelector((state: RootState) => state.projects)
  const [poolLiquidity, setPoolLiquidity] = useState<number>(0)
  const [loadingLiquidity, setLoadingLiquidity] = useState<boolean>(false)
  const isFetchingBnbPrice = useRef(false)
  const hasInitialBnbPriceFetch = useRef(false)
  const isCalculatingLiquidity = useRef(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  // Fetch BNB price with debounce mechanism
  const fetchBnbPriceData = useCallback(async () => {
    // Skip if fetch is already in progress or we've already fetched and have data
    if (isFetchingBnbPrice.current || (hasInitialBnbPriceFetch.current && bnbPrice)) return
    
    try {
      isFetchingBnbPrice.current = true
      await dispatch(fetchBnbPrice());
      hasInitialBnbPriceFetch.current = true
    } finally {
      isFetchingBnbPrice.current = false
    }
  }, [dispatch, bnbPrice]);

  useEffect(() => {
    fetchBnbPriceData();
  }, [fetchBnbPriceData]);

  // Calculate liquidity with fetch tracking
  const calculateLiquidity = useCallback(async () => {
    const tokenAddress = project.tokenAddress;
    if (!tokenAddress || !bnbPrice || isCalculatingLiquidity.current) return;
    
    try {
      isCalculatingLiquidity.current = true;
      setLoadingLiquidity(true);
      
      const poolInfo = await getPoolInfo(tokenAddress);
      if (poolInfo) {
        // Calculate liquidity in USD using the BNB price from Redux
        const liquidityInUsd = poolInfo.bnbReserve * bnbPrice * 2; // Times 2 because liquidity is balanced
        setPoolLiquidity(liquidityInUsd);
      } else {
        setPoolLiquidity(0);
      }
    } catch (error) {
      console.error('Failed to fetch liquidity:', error);
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
  }, [bnbPrice, project.tokenAddress, calculateLiquidity]);

  // Calculate active bots count similar to dashboard-metrics.tsx
  const calculateActiveBots = (): number => {
    let activeBots = 0;
    
    // Count active bots from addons
    if (project.addons) {
      // LiquidationSnipeBot
      if (project.addons.LiquidationSnipeBot?.isEnabled) {
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
    )
  }

  const metrics = {
    cumulativeProfit: projectStats?.metrics?.cumulativeProfit ?? project.metrics?.cumulativeProfit ?? 0,
    volume24h: projectStats?.metrics?.volume24h ?? project.metrics?.volume24h ?? 0,
    activeBots: calculateActiveBots(), // Use our new calculation method
    liquidity: poolLiquidity
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cumulative Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.cumulativeProfit)}</div>
          <p className="text-xs text-muted-foreground">
            Total profit since inception
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cumulative Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.volume24h)}</div>
          <p className="text-xs text-muted-foreground">
            Trading volume since inception
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(metrics.activeBots)}</div>
          <p className="text-xs text-muted-foreground">
            Currently active trading bots
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Liquidity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.liquidity)}</div>
          <p className="text-xs text-muted-foreground">
            Total available liquidity
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

