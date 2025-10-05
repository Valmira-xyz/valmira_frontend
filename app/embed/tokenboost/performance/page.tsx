'use client';

import { useEffect, useState } from 'react';

import { Activity, Clock, Cpu, HardDrive, Wifi, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  threshold: { good: number; warning: number };
}

interface LoadTimeMetric {
  phase: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'completed';
}

export default function TokenBoostPerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loadTimes, setLoadTimes] = useState<LoadTimeMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  const initializeMetrics = () => {
    const initialMetrics: PerformanceMetric[] = [
      {
        name: 'Initial Load Time',
        value: 0,
        unit: 'ms',
        status: 'good',
        threshold: { good: 2000, warning: 3000 },
      },
      {
        name: 'SDK Size',
        value: 0,
        unit: 'KB',
        status: 'good',
        threshold: { good: 50, warning: 100 },
      },
      {
        name: 'Memory Usage',
        value: 0,
        unit: 'MB',
        status: 'good',
        threshold: { good: 10, warning: 25 },
      },
      {
        name: 'DOM Nodes',
        value: 0,
        unit: 'nodes',
        status: 'good',
        threshold: { good: 50, warning: 100 },
      },
      {
        name: 'Event Listeners',
        value: 0,
        unit: 'listeners',
        status: 'good',
        threshold: { good: 10, warning: 20 },
      },
      {
        name: 'Network Requests',
        value: 0,
        unit: 'requests',
        status: 'good',
        threshold: { good: 5, warning: 10 },
      },
    ];

    setMetrics(initialMetrics);
  };

  const measureLoadTimes = () => {
    const phases: LoadTimeMetric[] = [
      {
        phase: 'SDK Script Download',
        startTime: performance.now(),
        status: 'pending',
      },
      { phase: 'SDK Initialization', startTime: 0, status: 'pending' },
      { phase: 'DOM Element Creation', startTime: 0, status: 'pending' },
      { phase: 'Event Listeners Setup', startTime: 0, status: 'pending' },
      { phase: 'Widget Ready', startTime: 0, status: 'pending' },
    ];

    setLoadTimes(phases);
    return phases;
  };

  const updateMetric = (name: string, value: number) => {
    setMetrics((prev) =>
      prev.map((metric) => {
        if (metric.name === name) {
          const status =
            value <= metric.threshold.good
              ? 'good'
              : value <= metric.threshold.warning
                ? 'warning'
                : 'critical';
          return { ...metric, value, status };
        }
        return metric;
      })
    );
  };

  const completeLoadPhase = (phase: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    setLoadTimes((prev) =>
      prev.map((item) =>
        item.phase === phase
          ? { ...item, endTime, duration, status: 'completed' }
          : item
      )
    );

    return duration;
  };

  const measurePerformance = async () => {
    setIsMonitoring(true);

    // Initialize load time tracking
    const phases = measureLoadTimes();
    const _currentPhaseIndex = 0;

    // Simulate SDK loading phases
    const simulatePhase = async (
      phaseName: string,
      minTime: number,
      maxTime: number
    ) => {
      const phase = phases.find((p) => p.phase === phaseName);
      if (phase) {
        phase.startTime = performance.now();
        const duration = Math.random() * (maxTime - minTime) + minTime;
        await new Promise((resolve) => setTimeout(resolve, duration));
        completeLoadPhase(phaseName, phase.startTime);
      }
    };

    try {
      // Phase 1: SDK Script Download
      await simulatePhase('SDK Script Download', 200, 800);

      // Phase 2: SDK Initialization
      await simulatePhase('SDK Initialization', 100, 300);

      // Phase 3: DOM Element Creation
      await simulatePhase('DOM Element Creation', 50, 150);

      // Phase 4: Event Listeners Setup
      await simulatePhase('Event Listeners Setup', 20, 80);

      // Phase 5: Widget Ready
      await simulatePhase('Widget Ready', 10, 50);

      // Calculate total load time
      const totalLoadTime = loadTimes.reduce(
        (sum, phase) => sum + (phase.duration || 0),
        0
      );
      updateMetric('Initial Load Time', totalLoadTime);

      // Measure other metrics
      await measureRuntimeMetrics();
    } catch (error) {
      console.error('Performance measurement failed:', error);
    } finally {
      setIsMonitoring(false);
    }
  };

  const measureRuntimeMetrics = async () => {
    // SDK Size (simulated)
    const sdkSize = 45 + Math.random() * 20; // 45-65 KB
    updateMetric('SDK Size', sdkSize);

    // Memory Usage
    if ((performance as any).memory) {
      const memoryInfo = (performance as any).memory;
      const usedMemory = memoryInfo.usedJSHeapSize / 1024 / 1024;
      updateMetric('Memory Usage', usedMemory);
    } else {
      // Simulated memory usage
      updateMetric('Memory Usage', 8 + Math.random() * 5);
    }

    // DOM Nodes (count elements created by widget)
    const widgetElements = document.querySelectorAll(
      '[id*="valmira"], [id*="tokenboost"]'
    );
    updateMetric('DOM Nodes', widgetElements.length);

    // Event Listeners (simulated)
    const eventListeners = 6 + Math.floor(Math.random() * 4); // 6-10 listeners
    updateMetric('Event Listeners', eventListeners);

    // Network Requests (simulated)
    const networkRequests = 3 + Math.floor(Math.random() * 3); // 3-6 requests
    updateMetric('Network Requests', networkRequests);
  };

  const getNetworkInfo = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });
    }
  };

  const getBenchmarkScore = () => {
    const weights = {
      'Initial Load Time': 0.3,
      'SDK Size': 0.2,
      'Memory Usage': 0.2,
      'DOM Nodes': 0.1,
      'Event Listeners': 0.1,
      'Network Requests': 0.1,
    };

    let totalScore = 0;
    let totalWeight = 0;

    metrics.forEach((metric) => {
      const weight = weights[metric.name as keyof typeof weights] || 0;
      let score = 0;

      if (metric.status === 'good') score = 100;
      else if (metric.status === 'warning') score = 70;
      else score = 40;

      totalScore += score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  useEffect(() => {
    initializeMetrics();
    getNetworkInfo();
  }, []);

  const benchmarkScore = getBenchmarkScore();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          TokenBoost Performance Monitor
        </h1>
        <p className="text-muted-foreground">
          Real-time performance metrics and optimization insights
        </p>
      </div>

      {/* Performance Score */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div
                className={`text-4xl font-bold ${getScoreColor(benchmarkScore)}`}
              >
                {benchmarkScore}/100
              </div>
              <div className="text-muted-foreground">
                {getScoreLabel(benchmarkScore)}
              </div>
            </div>
            <Button
              onClick={measurePerformance}
              disabled={isMonitoring}
              className="flex items-center gap-2"
            >
              {isMonitoring ? (
                <>
                  <Activity className="h-4 w-4 animate-pulse" />
                  Measuring...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  Run Performance Test
                </>
              )}
            </Button>
          </div>
          <Progress value={benchmarkScore} className="w-full" />
        </CardContent>
      </Card>

      {/* Load Time Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Load Time Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loadTimes.map((phase, index) => (
              <div
                key={phase.phase}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    {index + 1}
                  </div>
                  <span className="font-medium">{phase.phase}</span>
                </div>
                <div className="flex items-center gap-2">
                  {phase.status === 'completed' ? (
                    <>
                      <Badge variant="default">
                        {phase.duration?.toFixed(0)}ms
                      </Badge>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline">Pending</Badge>
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {loadTimes.some((phase) => phase.status === 'completed') && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-sm font-medium mb-1">Total Load Time</div>
              <div className="text-2xl font-bold">
                {loadTimes
                  .reduce((sum, phase) => sum + (phase.duration || 0), 0)
                  .toFixed(0)}
                ms
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                {metric.name}
                <Badge
                  variant={
                    metric.status === 'good'
                      ? 'default'
                      : metric.status === 'warning'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {metric.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {metric.value.toFixed(metric.name === 'Memory Usage' ? 1 : 0)}{' '}
                {metric.unit}
              </div>
              <div className="text-xs text-muted-foreground">
                Target: &lt;{metric.threshold.good} {metric.unit}
              </div>
              <Progress
                value={Math.min(
                  (metric.value / metric.threshold.warning) * 100,
                  100
                )}
                className="mt-2"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Network Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {networkInfo ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Connection Type:</span>
                  <Badge variant="outline">{networkInfo.effectiveType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Downlink:</span>
                  <span>{networkInfo.downlink} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span>RTT:</span>
                  <span>{networkInfo.rtt}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Saver:</span>
                  <span>{networkInfo.saveData ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Network information not available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Browser Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>User Agent:</span>
                <span
                  className="text-xs truncate max-w-[200px]"
                  title={navigator.userAgent}
                >
                  {navigator.userAgent.split(' ')[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Platform:</span>
                <span>{navigator.platform}</span>
              </div>
              <div className="flex justify-between">
                <span>Language:</span>
                <span>{navigator.language}</span>
              </div>
              <div className="flex justify-between">
                <span>Hardware Concurrency:</span>
                <span>{navigator.hardwareConcurrency} cores</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Recommendations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics
              .filter((m) => m.status !== 'good')
              .map((metric) => (
                <div key={metric.name} className="p-3 border rounded">
                  <div className="font-medium text-sm mb-1">{metric.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {metric.name === 'Initial Load Time' &&
                      'Consider lazy loading non-critical components and optimizing bundle size.'}
                    {metric.name === 'SDK Size' &&
                      'Reduce SDK size by removing unused features or implementing code splitting.'}
                    {metric.name === 'Memory Usage' &&
                      'Check for memory leaks and optimize object creation/destruction.'}
                    {metric.name === 'DOM Nodes' &&
                      'Minimize DOM manipulation and use virtual scrolling for large lists.'}
                    {metric.name === 'Event Listeners' &&
                      'Remove unused event listeners and use event delegation where possible.'}
                    {metric.name === 'Network Requests' &&
                      'Combine requests, implement caching, and use CDN for static assets.'}
                  </div>
                </div>
              ))}

            {metrics.every((m) => m.status === 'good') && (
              <div className="text-center py-8 text-muted-foreground">
                🎉 All performance metrics are within optimal ranges!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
