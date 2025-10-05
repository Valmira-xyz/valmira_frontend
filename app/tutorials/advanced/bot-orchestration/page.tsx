'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Settings,
  Target,
  Users,
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

export default function BotOrchestrationTutorial() {
  // const [activeStrategy, setActiveStrategy] = useState('volume-holder');

  const orchestrationStrategies = [
    {
      id: 'volume-holder',
      name: 'Volume + Holder Bot',
      description: 'Combine volume generation with holder acquisition',
      complexity: 'Medium',
      effectiveness: 'High',
    },
    {
      id: 'multi-phase',
      name: 'Multi-Phase Launch',
      description: 'Sequential bot activation for token launches',
      complexity: 'High',
      effectiveness: 'Very High',
    },
    {
      id: 'defensive',
      name: 'Defensive Strategy',
      description: 'Protect against dumps and maintain stability',
      complexity: 'Medium',
      effectiveness: 'High',
    },
  ];

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
              Advanced Bot Orchestration
            </Badge>
            <h1 className="text-4xl font-bold font-tt tracking-tight">
              Multi-Bot Strategy Orchestration
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how to coordinate multiple bots for maximum effectiveness
              and optimal resource management
            </p>
          </div>

          {/* Orchestration Overview */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bot Orchestration Overview
              </CardTitle>
              <CardDescription>
                Coordinate multiple bots for synergistic effects and optimal
                performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Available Bots</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Volume Bot
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Holder Bot
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Auto-Sell Bot
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Distribution Bot
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Orchestration Benefits</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Synergistic effects
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Resource optimization
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Risk mitigation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Automated coordination
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Key Metrics</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Efficiency Score
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Cost Per Action
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Success Rate
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      ROI Tracking
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Patterns */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Orchestration Strategies
              </CardTitle>
              <CardDescription>
                Proven patterns for combining multiple bots effectively
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="patterns" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="patterns">Patterns</TabsTrigger>
                  <TabsTrigger value="sequencing">Sequencing</TabsTrigger>
                  <TabsTrigger value="coordination">Coordination</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                </TabsList>

                <TabsContent value="patterns" className="space-y-4">
                  <h4 className="font-medium">Common Orchestration Patterns</h4>
                  <div className="space-y-4">
                    {orchestrationStrategies.map((strategy) => (
                      <div key={strategy.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium">{strategy.name}</h5>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {strategy.complexity}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {strategy.effectiveness}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {strategy.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">
                      Basic Bot Coordination Implementation
                    </h5>
                    <pre className="text-xs overflow-x-auto">
                      {`// Basic bot coordination using Valmira's pack system
import { packService } from '@/services/packService';

// Create a strategy pack with multiple bots
const strategyPack = {
  name: 'Volume + Holder Strategy',
  projectId: 'your-project-id',
  bots: [
    {
      type: 'volume',
      config: {
        budget: 0.1,
        interval: 5,
        minAmount: 0.001,
        maxAmount: 0.005
      }
    },
    {
      type: 'holder',
      config: {
        budget: 0.05,
        targetHolders: 50,
        minHolding: 1000,
        maxHolding: 10000
      }
    }
  ]
};

// Deploy the pack
try {
  const result = await packService.deployPack(strategyPack);
  console.log('Pack deployed:', result);
} catch (error) {
  console.error('Pack deployment failed:', error);
}

// Monitor pack performance
const packStatus = await packService.getPackStatus(result.packId);
console.log('Pack status:', packStatus);`}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="sequencing" className="space-y-4">
                  <h4 className="font-medium">Bot Execution Sequencing</h4>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Sequential Execution
                      </h5>
                      <pre className="text-xs overflow-x-auto">
                        {`// Sequential bot execution for token launch
const launchSequence = {
  phases: [
    {
      name: 'Initial Volume',
      duration: 300, // 5 minutes
      bots: ['volume'],
      config: {
        volume: {
          budget: 0.05,
          interval: 3,
          aggressive: true
        }
      }
    },
    {
      name: 'Holder Acquisition',
      duration: 600, // 10 minutes
      bots: ['volume', 'holder'],
      config: {
        volume: {
          budget: 0.03,
          interval: 8,
          aggressive: false
        },
        holder: {
          budget: 0.07,
          targetHolders: 100,
          priority: 'high'
        }
      }
    },
    {
      name: 'Stabilization',
      duration: 900, // 15 minutes
      bots: ['volume', 'auto-sell'],
      config: {
        volume: {
          budget: 0.02,
          interval: 15,
          maintenance: true
        },
        autoSell: {
          enabled: true,
          profitThreshold: 0.2,
          maxSellPercentage: 0.1
        }
      }
    }
  ]
};

// Execute launch sequence
await executeLaunchSequence(projectId, launchSequence);`}
                      </pre>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Parallel Execution with Coordination
                      </h5>
                      <pre className="text-xs overflow-x-auto">
                        {`// Parallel execution with resource coordination
const parallelConfig = {
  execution: 'parallel',
  resourcePool: {
    totalBudget: 0.5,
    allocation: {
      volume: 0.6,    // 60% of budget
      holder: 0.3,    // 30% of budget
      reserve: 0.1    // 10% reserve
    }
  },
  coordination: {
    // Prevent bots from competing for same transactions
    transactionCoordination: true,
    
    // Share market data between bots
    dataSharing: true,
    
    // Automatic rebalancing based on performance
    dynamicAllocation: true,
    
    // Stop conditions
    stopConditions: {
      maxLoss: 0.1,           // Stop if 10% loss
      targetReached: true,    // Stop when targets met
      timeLimit: 3600         // Stop after 1 hour
    }
  }
};

await startParallelExecution(projectId, parallelConfig);`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="coordination" className="space-y-4">
                  <h4 className="font-medium">Bot Coordination Mechanisms</h4>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Resource Management
                      </h5>
                      <pre className="text-xs overflow-x-auto">
                        {`// Advanced resource coordination
class BotOrchestrator {
  constructor(projectId, totalBudget) {
    this.projectId = projectId;
    this.totalBudget = totalBudget;
    this.activeBots = new Map();
    this.resourcePool = new ResourcePool(totalBudget);
  }

  async addBot(botType, config) {
    // Validate resource availability
    const requiredBudget = config.budget;
    if (!this.resourcePool.canAllocate(requiredBudget)) {
      throw new Error('Insufficient budget for bot');
    }

    // Create bot instance
    const bot = new Bot(botType, config);
    
    // Allocate resources
    this.resourcePool.allocate(bot.id, requiredBudget);
    
    // Add to active bots
    this.activeBots.set(bot.id, bot);
    
    // Set up coordination
    this.setupCoordination(bot);
    
    return bot;
  }

  setupCoordination(bot) {
    // Listen for bot events
    bot.on('transactionPending', (tx) => {
      // Notify other bots to avoid conflicts
      this.broadcastEvent('transaction-pending', tx);
    });

    bot.on('budgetLow', (remaining) => {
      // Trigger rebalancing
      this.rebalanceResources();
    });

    bot.on('targetReached', (metrics) => {
      // Evaluate overall strategy success
      this.evaluateStrategy();
    });
  }

  async rebalanceResources() {
    const performance = await this.getPerformanceMetrics();
    
    // Reallocate budget based on performance
    for (const [botId, bot] of this.activeBots) {
      const efficiency = performance[botId].efficiency;
      
      if (efficiency > 0.8) {
        // High performing bot gets more budget
        const additionalBudget = this.resourcePool.getAvailable() * 0.1;
        this.resourcePool.reallocate(botId, additionalBudget);
      } else if (efficiency < 0.3) {
        // Poor performing bot gets budget reduced
        const reduction = bot.allocatedBudget * 0.2;
        this.resourcePool.deallocate(botId, reduction);
      }
    }
  }
}`}
                      </pre>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Conflict Resolution
                      </h5>
                      <pre className="text-xs overflow-x-auto">
                        {`// Handle conflicts between bots
class ConflictResolver {
  constructor() {
    this.rules = [
      {
        condition: 'same-token-transaction',
        resolution: 'priority-based',
        action: this.resolvePriorityConflict
      },
      {
        condition: 'budget-exhaustion',
        resolution: 'rebalance',
        action: this.rebalanceBudgets
      },
      {
        condition: 'market-conditions',
        resolution: 'adaptive',
        action: this.adaptToMarket
      }
    ];
  }

  async resolveConflict(conflict) {
    const rule = this.rules.find(r => r.condition === conflict.type);
    
    if (rule) {
      return await rule.action(conflict);
    }
    
    // Default resolution
    return this.defaultResolution(conflict);
  }

  resolvePriorityConflict(conflict) {
    const { bot1, bot2, transaction } = conflict;
    
    // Higher priority bot gets the transaction
    if (bot1.priority > bot2.priority) {
      bot2.skipTransaction(transaction);
      return { winner: bot1, action: 'proceed' };
    } else {
      bot1.skipTransaction(transaction);
      return { winner: bot2, action: 'proceed' };
    }
  }

  async adaptToMarket(conflict) {
    const marketConditions = await this.getMarketConditions();
    
    if (marketConditions.volatility > 0.8) {
      // High volatility - reduce bot activity
      return { action: 'reduce-activity', factor: 0.5 };
    } else if (marketConditions.volume < 0.2) {
      // Low volume - increase activity
      return { action: 'increase-activity', factor: 1.5 };
    }
    
    return { action: 'maintain' };
  }
}`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-4">
                  <h4 className="font-medium">
                    Performance Monitoring & Analytics
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Real-time Monitoring
                      </h5>
                      <pre className="text-xs overflow-x-auto">
                        {`// Comprehensive monitoring system
class OrchestrationMonitor {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.metrics = new MetricsCollector();
    this.alerts = new AlertSystem();
  }

  startMonitoring() {
    // Monitor individual bot performance
    setInterval(() => {
      this.collectBotMetrics();
    }, 30000); // Every 30 seconds

    // Monitor overall strategy performance
    setInterval(() => {
      this.evaluateStrategy();
    }, 300000); // Every 5 minutes

    // Check for anomalies
    setInterval(() => {
      this.detectAnomalies();
    }, 60000); // Every minute
  }

  async collectBotMetrics() {
    const metrics = {};
    
    for (const [botId, bot] of this.orchestrator.activeBots) {
      metrics[botId] = {
        transactionsPerMinute: bot.getTransactionRate(),
        successRate: bot.getSuccessRate(),
        budgetUtilization: bot.getBudgetUtilization(),
        efficiency: bot.getEfficiencyScore(),
        errors: bot.getErrorCount(),
        lastActivity: bot.getLastActivity()
      };
    }

    this.metrics.record('bot-performance', metrics);
    
    // Check for performance issues
    this.checkPerformanceThresholds(metrics);
  }

  checkPerformanceThresholds(metrics) {
    for (const [botId, botMetrics] of Object.entries(metrics)) {
      // Low success rate alert
      if (botMetrics.successRate < 0.7) {
        this.alerts.trigger('low-success-rate', {
          botId,
          successRate: botMetrics.successRate,
          threshold: 0.7
        });
      }

      // High error rate alert
      if (botMetrics.errors > 10) {
        this.alerts.trigger('high-error-rate', {
          botId,
          errorCount: botMetrics.errors,
          threshold: 10
        });
      }

      // Budget depletion warning
      if (botMetrics.budgetUtilization > 0.9) {
        this.alerts.trigger('budget-warning', {
          botId,
          utilization: botMetrics.budgetUtilization,
          threshold: 0.9
        });
      }
    }
  }

  async evaluateStrategy() {
    const overallMetrics = {
      totalTransactions: 0,
      totalCost: 0,
      averageSuccessRate: 0,
      strategicGoalsAchieved: 0,
      roi: 0
    };

    // Calculate overall performance
    for (const bot of this.orchestrator.activeBots.values()) {
      const botMetrics = await bot.getDetailedMetrics();
      
      overallMetrics.totalTransactions += botMetrics.transactions;
      overallMetrics.totalCost += botMetrics.cost;
      overallMetrics.averageSuccessRate += botMetrics.successRate;
    }

    overallMetrics.averageSuccessRate /= this.orchestrator.activeBots.size;
    
    // Calculate ROI
    const tokenValue = await this.getTokenValue();
    overallMetrics.roi = (tokenValue - overallMetrics.totalCost) / overallMetrics.totalCost;

    this.metrics.record('strategy-performance', overallMetrics);
    
    return overallMetrics;
  }
}`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Orchestration Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h5 className="font-medium text-sm">Strategy Design</h5>
                  <ul className="space-y-2 text-xs">
                    <li>• Start with simple combinations</li>
                    <li>• Test strategies in small amounts</li>
                    <li>• Monitor performance continuously</li>
                    <li>• Implement gradual scaling</li>
                    <li>• Plan exit strategies</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h5 className="font-medium text-sm">Resource Management</h5>
                  <ul className="space-y-2 text-xs">
                    <li>• Maintain budget reserves</li>
                    <li>• Implement dynamic allocation</li>
                    <li>• Monitor gas costs closely</li>
                    <li>• Use performance-based scaling</li>
                    <li>• Set clear stop-loss limits</li>
                  </ul>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Risk Management</AlertTitle>
                <AlertDescription>
                  Always implement proper risk controls when orchestrating
                  multiple bots. Set clear budgets, stop-loss conditions, and
                  monitor performance actively.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Master Bot Orchestration
                </h3>
                <p className="text-muted-foreground">
                  Advanced coordination techniques for maximum bot effectiveness
                  and resource optimization
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/tutorials/advanced/performance-optimization">
                      <Zap className="h-4 w-4 mr-2" />
                      Performance Optimization
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/tutorials/advanced/web3-integration">
                      Web3 Integration
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
