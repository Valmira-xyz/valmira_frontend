'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Monitor,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PerformanceOptimizationTutorial() {
  // const [activeMetric, setActiveMetric] = useState('cost');

  // const optimizationAreas = [
  //   {
  //     id: 'cost',
  //     name: 'Cost Optimization',
  //     description: 'Minimize operational costs while maintaining effectiveness',
  //     impact: 'High',
  //     difficulty: 'Medium'
  //   },
  //   {
  //     id: 'speed',
  //     name: 'Speed Optimization',
  //     description: 'Improve transaction speed and response times',
  //     impact: 'Medium',
  //     difficulty: 'Low'
  //   },
  //   {
  //     id: 'efficiency',
  //     name: 'Resource Efficiency',
  //     description: 'Optimize resource allocation and utilization',
  //     impact: 'High',
  //     difficulty: 'High'
  //   },
  //   {
  //     id: 'scalability',
  //     name: 'Scalability',
  //     description: 'Handle increased load and multiple projects',
  //     impact: 'Very High',
  //     difficulty: 'High'
  //   }
  // ];

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tutorials">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tutorials
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="mb-4">
              Advanced Performance Optimization
            </Badge>
            <h1 className="text-4xl font-bold font-tt tracking-tight">
              System Performance Optimization
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Master advanced techniques for optimizing cost, speed, and
              resource efficiency in your Valmira operations
            </p>
          </div>

          {/* Performance Overview */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Optimization Overview
              </CardTitle>
              <CardDescription>
                Key areas for improving system performance and reducing costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Optimization Targets</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Reduce operational costs by 30-50%
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Improve transaction speed by 2-3x
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Increase bot efficiency by 40%
                    </li>
                    <li className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-purple-500" />
                      Scale to handle 10x more projects
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Key Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-500">
                        -45%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cost Reduction
                      </div>
                    </div>
                    <div className="border rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        2.8x
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Speed Improvement
                      </div>
                    </div>
                    <div className="border rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-500">
                        +42%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Efficiency Gain
                      </div>
                    </div>
                    <div className="border rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-500">
                        12x
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Scale Factor
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimization Strategies */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Optimization Strategies
              </CardTitle>
              <CardDescription>
                Comprehensive approaches to system optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="cost" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="cost">Cost</TabsTrigger>
                  <TabsTrigger value="speed">Speed</TabsTrigger>
                  <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                </TabsList>

                <TabsContent value="cost" className="space-y-4">
                  <h4 className="font-medium">Cost Optimization Strategies</h4>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Gas Optimization Best Practices
                      </h5>
                      <pre className="text-xs overflow-x-auto">
                        {`// Basic gas optimization techniques used in Valmira
import { estimateGas, getGasPrice } from '@wagmi/core';

// 1. Estimate gas before transactions
async function optimizeGasUsage(transaction) {
  try {
    // Get current gas price
    const gasPrice = await getGasPrice();
    
    // Estimate gas for the transaction
    const gasEstimate = await estimateGas({
      to: transaction.to,
      data: transaction.data,
      value: transaction.value
    });
    
    // Add 10% buffer for safety
    const optimizedGasLimit = gasEstimate * BigInt(110) / BigInt(100);
    
    return {
      ...transaction,
      gasPrice,
      gasLimit: optimizedGasLimit
    };
  } catch (error) {
    console.error('Gas optimization failed:', error);
    return transaction;
  }
}

// 2. Monitor gas prices for optimal timing
async function getOptimalGasPrice() {
  const currentPrice = await getGasPrice();
  
  // Use current price with small buffer for faster confirmation
  return currentPrice * BigInt(105) / BigInt(100);
}

// 3. Basic transaction batching concept
function batchSimilarTransactions(transactions) {
  // Group transactions by type
  const grouped = transactions.reduce((acc, tx) => {
    const key = tx.type || 'default';
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});
  
  return Object.values(grouped);
}`}
                      </pre>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Budget Optimization
                      </h5>
                      <pre className="text-xs overflow-x-auto">
                        {`// Dynamic budget allocation based on performance
class BudgetOptimizer {
  constructor(totalBudget) {
    this.totalBudget = totalBudget;
    this.allocations = new Map();
    this.performance = new Map();
  }

  optimizeAllocation(bots) {
    // Calculate efficiency scores
    const efficiencyScores = this.calculateEfficiency(bots);
    
    // Reallocate based on performance
    const newAllocations = this.reallocateBudget(efficiencyScores);
    
    // Apply minimum thresholds
    return this.applyMinimumThresholds(newAllocations);
  }

  calculateEfficiency(bots) {
    const scores = {};
    
    for (const [botId, bot] of bots) {
      const metrics = bot.getMetrics();
      
      // Efficiency = (Value Generated) / (Cost Spent)
      scores[botId] = {
        efficiency: metrics.valueGenerated / metrics.costSpent,
        roi: (metrics.valueGenerated - metrics.costSpent) / metrics.costSpent,
        successRate: metrics.successfulTransactions / metrics.totalTransactions,
        costPerAction: metrics.costSpent / metrics.successfulTransactions
      };
    }
    
    return scores;
  }

  reallocateBudget(efficiencyScores) {
    const totalEfficiency = Object.values(efficiencyScores)
      .reduce((sum, score) => sum + score.efficiency, 0);
    
    const allocations = {};
    
    for (const [botId, score] of Object.entries(efficiencyScores)) {
      // Allocate budget proportional to efficiency
      const baseAllocation = (score.efficiency / totalEfficiency) * this.totalBudget;
      
      // Apply performance multipliers
      let multiplier = 1;
      if (score.roi > 0.5) multiplier = 1.2;      // High ROI bonus
      if (score.successRate > 0.9) multiplier *= 1.1; // High success bonus
      if (score.costPerAction < 0.001) multiplier *= 1.1; // Low cost bonus
      
      allocations[botId] = Math.min(
        baseAllocation * multiplier,
        this.totalBudget * 0.4 // Max 40% to any single bot
      );
    }
    
    return allocations;
  }
}`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="speed" className="space-y-4">
                  <h4 className="font-medium">Speed Optimization</h4>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Transaction Speed Optimization
                      </h5>
                      <pre className="text-xs overflow-x-auto">
                        {`// Optimize transaction speed and throughput
class SpeedOptimizer {
  constructor() {
    this.transactionQueue = new PriorityQueue();
    this.nonceManager = new NonceManager();
    this.connectionPool = new ConnectionPool();
  }

  async optimizeTransactionSpeed(transactions) {
    // 1. Parallel processing with nonce management
    const parallelTxs = await this.prepareParallelTransactions(transactions);
    
    // 2. Use multiple RPC connections
    const connections = this.connectionPool.getOptimalConnections();
    
    // 3. Implement transaction pipelining
    return this.pipelineTransactions(parallelTxs, connections);
  }

  async prepareParallelTransactions(transactions) {
    const prepared = [];
    
    for (const tx of transactions) {
      // Get next available nonce
      const nonce = await this.nonceManager.getNextNonce(tx.from);
      
      // Optimize gas price for speed
      const gasPrice = await this.getSpeedOptimizedGasPrice();
      
      prepared.push({
        ...tx,
        nonce,
        gasPrice,
        gasLimit: tx.gasLimit * 1.1, // 10% buffer for speed
        priority: this.calculatePriority(tx)
      });
    }
    
    return prepared.sort((a, b) => b.priority - a.priority);
  }

  async pipelineTransactions(transactions, connections) {
    const results = [];
    const batchSize = connections.length;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      // Send batch in parallel
      const batchPromises = batch.map((tx, index) => 
        this.sendTransaction(tx, connections[index % connections.length])
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Small delay to prevent overwhelming the network
      if (i + batchSize < transactions.length) {
        await this.delay(100); // 100ms delay
      }
    }
    
    return results;
  }

  getSpeedOptimizedGasPrice() {
    // Use higher gas price for faster confirmation
    return this.getCurrentGasPrice().then(price => price * 1.5);
  }
}`}
                      </pre>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Caching and Precomputation
                      </h5>
                      <pre className="text-xs overflow-x-auto">
                        {`// Implement intelligent caching for speed
class CacheOptimizer {
  constructor() {
    this.cache = new Map();
    this.precomputeQueue = new Queue();
  }

  // Cache frequently accessed data
  async getCachedData(key, fetcher, ttl = 300000) { // 5 min TTL
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }

  // Precompute expensive operations
  async precomputeTransactions(projectId) {
    const project = await this.getProject(projectId);
    
    // Precompute common transaction data
    const precomputed = {
      tokenBalance: await this.getTokenBalance(project.tokenAddress),
      gasEstimates: await this.precomputeGasEstimates(project),
      optimalAmounts: await this.calculateOptimalAmounts(project),
      routingPaths: await this.precomputeRoutingPaths(project)
    };
    
    this.cache.set(\`precomputed-\${projectId}\`, {
      data: precomputed,
      timestamp: Date.now()
    });
    
    return precomputed;
  }

  async precomputeGasEstimates(project) {
    const operations = ['buy', 'sell', 'transfer', 'approve'];
    const estimates = {};
    
    for (const op of operations) {
      estimates[op] = await this.estimateGas(project, op);
    }
    
    return estimates;
  }
}`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="efficiency" className="space-y-4">
                  <h4 className="font-medium">Resource Efficiency</h4>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Resource Pool Management
                      </h5>
                      <pre className="text-xs overflow-x-auto">
                        {`// Efficient resource allocation and management
class ResourceManager {
  constructor() {
    this.pools = {
      budget: new BudgetPool(),
      connections: new ConnectionPool(),
      compute: new ComputePool()
    };
    this.allocations = new Map();
  }

  async allocateResources(request) {
    // Calculate optimal allocation
    const allocation = await this.calculateOptimalAllocation(request);
    
    // Reserve resources
    const reservation = await this.reserveResources(allocation);
    
    // Track allocation
    this.allocations.set(request.id, reservation);
    
    return reservation;
  }

  calculateOptimalAllocation(request) {
    const { priority, estimatedDuration, resourceRequirements } = request;
    
    // Use machine learning model for optimal allocation
    return this.mlModel.predict({
      priority,
      duration: estimatedDuration,
      requirements: resourceRequirements,
      currentLoad: this.getCurrentLoad(),
      historicalPerformance: this.getHistoricalPerformance()
    });
  }

  async optimizeResourceUtilization() {
    // Analyze current utilization
    const utilization = await this.analyzeUtilization();
    
    // Identify inefficiencies
    const inefficiencies = this.identifyInefficiencies(utilization);
    
    // Apply optimizations
    for (const inefficiency of inefficiencies) {
      await this.applyOptimization(inefficiency);
    }
    
    return this.getOptimizationResults();
  }

  identifyInefficiencies(utilization) {
    const inefficiencies = [];
    
    // Check for underutilized resources
    if (utilization.budget < 0.7) {
      inefficiencies.push({
        type: 'underutilized-budget',
        severity: 'medium',
        recommendation: 'increase-bot-activity'
      });
    }
    
    // Check for resource contention
    if (utilization.connections > 0.9) {
      inefficiencies.push({
        type: 'connection-bottleneck',
        severity: 'high',
        recommendation: 'scale-connections'
      });
    }
    
    // Check for idle bots
    const idleBots = this.getIdleBots();
    if (idleBots.length > 0) {
      inefficiencies.push({
        type: 'idle-bots',
        severity: 'low',
        recommendation: 'redistribute-tasks',
        data: idleBots
      });
    }
    
    return inefficiencies;
  }
}`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-4">
                  <h4 className="font-medium">
                    Performance Monitoring & Alerting
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Real-time Performance Monitoring
                      </h5>
                      <pre className="text-xs overflow-x-auto">
                        {`// Comprehensive performance monitoring system
class PerformanceMonitor {
  constructor() {
    this.metrics = new MetricsCollector();
    this.alerts = new AlertSystem();
    this.dashboard = new PerformanceDashboard();
  }

  startMonitoring() {
    // Collect metrics every 10 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 10000);

    // Analyze performance every minute
    setInterval(() => {
      this.analyzePerformance();
    }, 60000);

    // Generate reports every hour
    setInterval(() => {
      this.generatePerformanceReport();
    }, 3600000);
  }

  async collectMetrics() {
    const metrics = {
      system: await this.getSystemMetrics(),
      bots: await this.getBotMetrics(),
      transactions: await this.getTransactionMetrics(),
      costs: await this.getCostMetrics(),
      efficiency: await this.getEfficiencyMetrics()
    };

    this.metrics.record(metrics);
    this.checkThresholds(metrics);
    
    return metrics;
  }

  async getSystemMetrics() {
    return {
      cpuUsage: await this.getCPUUsage(),
      memoryUsage: await this.getMemoryUsage(),
      networkLatency: await this.getNetworkLatency(),
      connectionCount: this.getActiveConnections(),
      queueDepth: this.getQueueDepth()
    };
  }

  async getBotMetrics() {
    const bots = this.getActiveBots();
    const metrics = {};

    for (const bot of bots) {
      metrics[bot.id] = {
        transactionRate: bot.getTransactionRate(),
        successRate: bot.getSuccessRate(),
        errorRate: bot.getErrorRate(),
        averageLatency: bot.getAverageLatency(),
        budgetUtilization: bot.getBudgetUtilization(),
        efficiency: bot.getEfficiencyScore()
      };
    }

    return metrics;
  }

  checkThresholds(metrics) {
    // System performance thresholds
    if (metrics.system.cpuUsage > 80) {
      this.alerts.trigger('high-cpu-usage', metrics.system.cpuUsage);
    }

    if (metrics.system.memoryUsage > 85) {
      this.alerts.trigger('high-memory-usage', metrics.system.memoryUsage);
    }

    // Bot performance thresholds
    for (const [botId, botMetrics] of Object.entries(metrics.bots)) {
      if (botMetrics.successRate < 70) {
        this.alerts.trigger('low-success-rate', { botId, rate: botMetrics.successRate });
      }

      if (botMetrics.efficiency < 0.5) {
        this.alerts.trigger('low-efficiency', { botId, efficiency: botMetrics.efficiency });
      }
    }

    // Cost thresholds
    if (metrics.costs.hourlyBurn > this.maxHourlyBurn) {
      this.alerts.trigger('high-burn-rate', metrics.costs.hourlyBurn);
    }
  }

  async generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      summary: await this.getPerformanceSummary(),
      trends: await this.getPerformanceTrends(),
      recommendations: await this.getOptimizationRecommendations(),
      alerts: this.alerts.getRecentAlerts(),
      costs: await this.getCostAnalysis()
    };

    // Store report
    await this.storeReport(report);
    
    // Send to dashboard
    this.dashboard.updateReport(report);
    
    return report;
  }
}`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Optimization Checklist */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Performance Optimization Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h5 className="font-medium text-sm">Cost Optimization</h5>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Implement gas price optimization
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Use transaction batching
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Optimize budget allocation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Monitor and reduce waste
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h5 className="font-medium text-sm">Speed & Efficiency</h5>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Implement caching strategies
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Use parallel processing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Optimize resource allocation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Monitor performance metrics
                    </li>
                  </ul>
                </div>
              </div>

              <Alert>
                <Monitor className="h-4 w-4" />
                <AlertTitle>Continuous Optimization</AlertTitle>
                <AlertDescription>
                  Performance optimization is an ongoing process. Regularly
                  review metrics, test new strategies, and adapt to changing
                  market conditions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Completion */}
          <Card className="border bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Performance Mastery Complete
                </h3>
                <p className="text-muted-foreground">
                  You've learned advanced optimization techniques for cost,
                  speed, and efficiency
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/tutorials">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Back to Tutorials
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/tutorials/advanced/bot-orchestration">
                      Bot Orchestration
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
