'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronRight,
  Code,
  Database,
  ExternalLink,
  Settings,
  Shield,
  Target,
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

export default function AdvancedTutorialHub() {
  const advancedTopics = [
    {
      title: 'API Integration',
      description: 'Backend API usage and integration patterns',
      icon: Code,
      difficulty: 'Advanced',
      topics: [
        'Authentication flows',
        'API endpoints',
        'Rate limiting',
        'Error handling',
      ],
      comingSoon: true,
    },
    {
      title: 'Web3 Integration',
      description: 'Blockchain interactions and smart contracts',
      icon: Database,
      difficulty: 'Expert',
      topics: [
        'Smart contract interactions',
        'Transaction handling',
        'Gas optimization',
        'Network switching',
      ],
      comingSoon: true,
    },
    {
      title: 'Bot Orchestration',
      description: 'Multi-bot strategies and coordination',
      icon: Settings,
      difficulty: 'Advanced',
      topics: [
        'Bot combination patterns',
        'Execution sequencing',
        'Resource management',
        'Performance optimization',
      ],
      comingSoon: true,
    },
    {
      title: 'Performance Optimization',
      description: 'System optimization and monitoring',
      icon: BarChart3,
      difficulty: 'Advanced',
      topics: [
        'Cost optimization',
        'Speed improvements',
        'Resource allocation',
        'Monitoring and alerting',
      ],
      comingSoon: true,
    },
  ];

  const currentFeatures = [
    {
      title: 'Volume Bot Advanced Strategies',
      description: 'Optimize volume generation for maximum impact',
      topics: [
        'Custom trading patterns for organic appearance',
        'Multi-wallet coordination strategies',
        'Gas fee optimization techniques',
        'Market timing for maximum effectiveness',
      ],
    },
    {
      title: 'Holder Bot Scaling Techniques',
      description: 'Scale holder generation efficiently',
      topics: [
        'Batch processing optimization',
        'Time-delayed distribution strategies',
        'Natural holder pattern simulation',
        'Cost-effective scaling methods',
      ],
    },
    {
      title: 'Multi-Bot Coordination',
      description: 'Coordinate multiple bots for synergistic effects',
      topics: [
        'Sequential bot activation strategies',
        'Resource allocation between bots',
        'Performance monitoring across bots',
        'Conflict resolution and optimization',
      ],
    },
    {
      title: 'Risk Management Frameworks',
      description: 'Advanced risk management and protection strategies',
      topics: [
        'Portfolio diversification across projects',
        'Automated stop-loss implementation',
        'Market condition adaptation',
        'Emergency response procedures',
      ],
    },
  ];

  const technicalResources = [
    {
      title: 'Bot Model Schemas',
      description: 'Technical specifications for all bot types',
      items: [
        'Volume Bot: minNativeAmount, maxNativeAmount, timeBetweenTransactions',
        'Holder Bot: generatedHolders, targetHolders, distributionPattern',
        'Distribution Bot: targetWallets, completedDistributions, sourceType',
        'Auto Sell Bot: tokenBalance, activeWallets, sellPrice, stopLoss',
        'Bundle Snipe Bot: tokenBalance, simulationStatus, snipeStatus',
      ],
    },
    {
      title: 'Network Specifications',
      description: 'Supported networks and their configurations',
      items: [
        'BSC Mainnet: Chain ID 56, PancakeSwap V2 integration',
        'Ethereum Mainnet: Chain ID 1, Uniswap V2 integration',
        'Gas fee structures and optimization strategies',
        'Network-specific best practices and limitations',
      ],
    },
    {
      title: 'Status Enumerations',
      description: 'All possible bot statuses and their meanings',
      items: [
        'Volume Bot: inactive, active, paused, error states',
        'Holder Bot: ready, generating, completed, failed',
        'Auto Sell Bot: ready_to_autosell, auto_selling, sell_succeeded',
        'Bundle Snipe: ready_to_simulation, simulating, sniping, snipe_succeeded',
      ],
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tutorials">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tutorials
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="mb-4">
              Advanced Documentation Hub
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Advanced Valmira Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Technical documentation, advanced strategies, and in-depth guides
              for power users and developers
            </p>
          </div>

          {/* Prerequisites */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Prerequisites</AlertTitle>
            <AlertDescription>
              This section is for advanced users. Make sure you've completed the
              basic tutorials and have experience with at least 2-3 bots before
              proceeding.
            </AlertDescription>
          </Alert>

          {/* Current Advanced Features */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Available Advanced Guides
              </CardTitle>
              <CardDescription>
                In-depth strategies and techniques you can implement today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {currentFeatures.map((feature, index) => (
                  <Card key={index} className="border">
                    <CardHeader>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {feature.topics.map((topic, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Reference */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Technical Reference
              </CardTitle>
              <CardDescription>
                Technical specifications and implementation details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="schemas" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="schemas">Bot Schemas</TabsTrigger>
                  <TabsTrigger value="networks">Networks</TabsTrigger>
                  <TabsTrigger value="statuses">Status Codes</TabsTrigger>
                </TabsList>

                <TabsContent value="schemas" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">
                      Bot Configuration Parameters
                    </h4>
                    <div className="space-y-4">
                      {technicalResources[0].items.map((item, index) => (
                        <div key={index} className="bg-muted/50 p-3 rounded-lg">
                          <code className="text-sm">{item}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="networks" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Supported Networks</h4>
                    <div className="space-y-4">
                      {technicalResources[1].items.map((item, index) => (
                        <div key={index} className="bg-muted/50 p-3 rounded-lg">
                          <code className="text-sm">{item}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="statuses" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">
                      Bot Status Enumerations
                    </h4>
                    <div className="space-y-4">
                      {technicalResources[2].items.map((item, index) => (
                        <div key={index} className="bg-muted/50 p-3 rounded-lg">
                          <code className="text-sm">{item}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Coming Soon Features */}
          <Card className="border border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <BookOpen className="h-5 w-5" />
                Coming Soon - Advanced Tutorials
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Advanced tutorials currently in development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {advancedTopics.map((topic, index) => (
                  <Card key={index} className="border border-blue-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <topic.icon className="h-6 w-6 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">
                              {topic.title}
                            </CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {topic.difficulty}
                            </Badge>
                          </div>
                        </div>
                        {topic.comingSoon && (
                          <Badge variant="secondary">Coming Soon</Badge>
                        )}
                      </div>
                      <CardDescription>{topic.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm">
                        {topic.topics.map((item, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Strategy Examples */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Advanced Strategy Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">
                  Multi-Bot Launch Strategy
                </h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <p>
                    <strong>Phase 1 (Day 1):</strong> Activate Volume Bot with
                    conservative settings
                  </p>
                  <p>
                    <strong>Phase 2 (Day 2-3):</strong> Add Holder Bot to build
                    community appearance
                  </p>
                  <p>
                    <strong>Phase 3 (Day 4-7):</strong> Implement Auto Sell Bot
                    for profit protection
                  </p>
                  <p>
                    <strong>Phase 4 (Week 2+):</strong> Add Distribution Bot for
                    community engagement
                  </p>
                  <p>
                    <strong>Advanced:</strong> Bundle Snipe Bot for additional
                    profit opportunities
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">
                  Cost Optimization Framework
                </h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <p>
                    <strong>Network Selection:</strong> Start on BSC (90% lower
                    fees), migrate to ETH when profitable
                  </p>
                  <p>
                    <strong>Timing Strategy:</strong> Execute during low gas
                    periods (weekends, late nights UTC)
                  </p>
                  <p>
                    <strong>Batch Operations:</strong> Group bot configurations
                    and activations
                  </p>
                  <p>
                    <strong>Performance Monitoring:</strong> Track ROI and
                    adjust parameters weekly
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Risk Management Protocol</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <p>
                    <strong>Portfolio Limits:</strong> Never risk more than 10%
                    of total portfolio per project
                  </p>
                  <p>
                    <strong>Bot Limits:</strong> Set daily spending limits for
                    each bot type
                  </p>
                  <p>
                    <strong>Emergency Procedures:</strong> Pre-defined steps for
                    pausing all bots quickly
                  </p>
                  <p>
                    <strong>Performance Thresholds:</strong> Automatic
                    adjustments based on success rates
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Developer Resources */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Developer Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">API Documentation</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Widget API endpoints and authentication</li>
                    <li>• Bot management API reference</li>
                    <li>• Analytics and metrics API</li>
                    <li>• Error codes and handling</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Integration Guides</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• TokenBoost widget integration</li>
                    <li>• Custom dashboard development</li>
                    <li>• Webhook implementation</li>
                    <li>• Third-party integrations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start CTA */}
          <Card className="border bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Ready for Advanced Strategies?
                </h3>
                <p className="text-muted-foreground">
                  Start implementing advanced techniques to maximize your
                  Valmira success
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/projects">Apply Advanced Strategies</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/tutorials/best-practices">
                      Review Best Practices
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
