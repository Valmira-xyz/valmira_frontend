'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle,
  HelpCircle,
  Settings,
  Target,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BundleSnipeTutorial() {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  const handleStepClick = (index: number) => {
    setActiveStep(index);
  };

  const steps = [
    {
      title: 'Run Simulation',
      description: 'Test the bot with simulated trading scenarios',
      icon: Settings,
    },
    {
      title: 'Configure Sniping',
      description: 'Set up real trading parameters and risk management',
      icon: Target,
    },
    {
      title: 'Execute & Monitor',
      description: 'Activate bot and monitor performance in real-time',
      icon: Zap,
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
              Bundle Snipe Bot Tutorial
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Bundle Snipe Bot Complete Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced trading tool that monitors transaction bundles and
              executes profitable trades by capturing price discrepancies
            </p>
          </div>

          {/* What & Why Section */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                What is the Bundle Snipe Bot and Why Use It?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">What It Does</h3>
                <p className="text-muted-foreground mb-4">
                  The Bundle Snipe Bot is an advanced trading tool that monitors
                  transaction bundles in real-time and executes profitable
                  trades by capturing price discrepancies and arbitrage
                  opportunities. It's like having a professional high-frequency
                  trader working for your project 24/7.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">How It Works:</p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Real-Time Monitoring:</strong> Continuously
                      watches incoming transaction bundles
                    </li>
                    <li>
                      <strong>Opportunity Analysis:</strong> Identifies
                      potential arbitrage and profit opportunities
                    </li>
                    <li>
                      <strong>Rapid Execution:</strong> Executes trades to
                      capture price discrepancies
                    </li>
                    <li>
                      <strong>Risk Management:</strong> Built-in safeguards to
                      optimize profit while managing risk
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Why You Need It</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          Automated Profit Generation
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Captures opportunities you'd never see manually
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Competitive Advantage</p>
                        <p className="text-sm text-muted-foreground">
                          Levels the playing field against other automated
                          traders
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">24/7 Operation</p>
                        <p className="text-sm text-muted-foreground">
                          Never misses opportunities due to sleep or other
                          commitments
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Risk-Managed Trading</p>
                        <p className="text-sm text-muted-foreground">
                          Built-in safeguards prevent major losses
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Configuration */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Technical Configuration & Bot Statuses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="statuses">Bot Statuses</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Config</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Default Parameters</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Token Balance:</span>
                          <code className="bg-muted px-2 py-1 rounded">
                            0 (default)
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span>Initial Status:</span>
                          <Badge variant="secondary">ready_to_simulation</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Supported Networks:</span>
                          <span className="font-medium">BSC, ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bot Type:</span>
                          <code className="bg-muted px-2 py-1 rounded">
                            SnipeBot
                          </code>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">
                        Recommended Settings
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Risk Level:</span>
                          <span className="font-medium">
                            Conservative (start)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profit Threshold:</span>
                          <span className="font-medium">
                            Set minimum requirements
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Position Size:</span>
                          <span className="font-medium">
                            Limit per transaction
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="statuses" className="space-y-4">
                  <Alert>
                    <BarChart3 className="h-4 w-4" />
                    <AlertTitle>Bot Status Lifecycle</AlertTitle>
                    <AlertDescription>
                      The Bundle Snipe Bot goes through multiple phases from
                      simulation to execution.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="secondary">ready_to_simulation</Badge>
                      <span className="text-sm">
                        Bot is configured and ready to run simulations
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="outline">simulating</Badge>
                      <span className="text-sm">
                        Bot is currently running simulation tests
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="destructive">simulation_failed</Badge>
                      <span className="text-sm">
                        Simulation encountered errors (check configuration)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge className="bg-green-500">
                        simulation_succeeded
                      </Badge>
                      <span className="text-sm">
                        Simulation completed successfully, ready for live
                        trading
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="default">sniping</Badge>
                      <span className="text-sm">
                        Bot is actively monitoring and executing trades
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge className="bg-green-500">snipe_succeeded</Badge>
                      <span className="text-sm">
                        Successfully executed a profitable snipe trade
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="destructive">snipe_failed</Badge>
                      <span className="text-sm">
                        Snipe attempt failed (check liquidity, gas fees)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="outline">auto_selling</Badge>
                      <span className="text-sm">
                        Bot is selling acquired tokens automatically
                      </span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Advanced Configuration</AlertTitle>
                    <AlertDescription>
                      This is an advanced bot requiring good understanding of
                      trading concepts. Start with conservative settings.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Risk Management</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <p>
                            <strong>Position Sizing:</strong> Limit maximum
                            trade size to manage risk
                          </p>
                          <p>
                            <strong>Stop-Loss Integration:</strong> Automatic
                            loss limits for risk management
                          </p>
                          <p>
                            <strong>Profit Thresholds:</strong> Minimum profit
                            requirements before execution
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p>
                            <strong>Market Conditions:</strong> Adjust strategy
                            based on volatility
                          </p>
                          <p>
                            <strong>Liquidity Checks:</strong> Ensure sufficient
                            liquidity before trading
                          </p>
                          <p>
                            <strong>Gas Optimization:</strong> Smart gas fee
                            management for profitability
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Step-by-Step Setup */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Step-by-Step Setup Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                      activeStep === index
                        ? 'bg-primary/5 border-primary'
                        : 'bg-muted/30'
                    }`}
                    onClick={() => handleStepClick(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleStepClick(index)
                    }
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activeStep === index
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground mb-3">
                        {step.description}
                      </p>

                      {index === 0 && (
                        <div className="space-y-2 text-sm">
                          <p>1. Navigate to your project dashboard</p>
                          <p>
                            2. Find the Bundle Snipe Bot in the "Add-ons"
                            section
                          </p>
                          <p>
                            3. Verify bot status shows "ready_to_simulation"
                          </p>
                          <p>4. Click "Run Simulation" to test the bot</p>
                          <p>5. Monitor simulation progress and results</p>
                          <p>6. Wait for "simulation_succeeded" status</p>
                        </div>
                      )}

                      {index === 1 && (
                        <div className="space-y-2 text-sm">
                          <p>
                            1. Set your risk level (start with Conservative)
                          </p>
                          <p>2. Configure profit threshold requirements</p>
                          <p>3. Set maximum position size limits</p>
                          <p>4. Enable stop-loss protection</p>
                          <p>
                            5. Review all settings carefully before activation
                          </p>
                        </div>
                      )}

                      {index === 2 && (
                        <div className="space-y-2 text-sm">
                          <p>1. Activate the bot to start live monitoring</p>
                          <p>
                            2. Watch for "sniping" status indicating active
                            operation
                          </p>
                          <p>3. Monitor for "snipe_succeeded" notifications</p>
                          <p>4. Track token balance and profit generation</p>
                          <p>5. Adjust settings based on performance</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={activeStep === 0}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={activeStep === steps.length - 1}
                    className="gap-2"
                  >
                    {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
                    <ArrowLeft
                      className={`h-4 w-4 ${activeStep === steps.length - 1 ? 'hidden' : 'rotate-180'}`}
                    />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Strategies & Troubleshooting */}
          <Card className="border">
            <CardHeader>
              <CardTitle>Advanced Strategies & Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="strategies">
                  <AccordionTrigger>
                    Advanced Bundle Snipe Strategies
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Compatible Bot Combinations
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Bundle Snipe + Auto Sell Bot:</strong> Snipe
                          opportunities then auto-sell at profits
                        </li>
                        <li>
                          <strong>Bundle Snipe + Volume Bot:</strong> Generate
                          volume while capturing trading opportunities
                        </li>
                        <li>
                          <strong>Bundle Snipe + Distribution Bot:</strong> Use
                          sniped tokens for community distributions
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Risk Management Levels
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Conservative:</strong> Small position sizes,
                          high profit thresholds, tight stop-losses
                        </li>
                        <li>
                          <strong>Moderate:</strong> Medium positions, balanced
                          risk/reward ratios
                        </li>
                        <li>
                          <strong>Aggressive:</strong> Larger positions, lower
                          thresholds, higher risk tolerance
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Market Timing</h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>High Volatility:</strong> More opportunities
                          but higher risk
                        </li>
                        <li>
                          <strong>Low Volatility:</strong> Fewer opportunities
                          but more predictable
                        </li>
                        <li>
                          <strong>News Events:</strong> Increased activity
                          around major announcements
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="troubleshooting">
                  <AccordionTrigger>Common Issues & Solutions</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Simulation Failures
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Check network connectivity and stability</li>
                        <li>
                          • Verify sufficient gas fees for test transactions
                        </li>
                        <li>
                          • Ensure token has adequate liquidity for testing
                        </li>
                        <li>• Review configuration parameters for errors</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Snipe Failures</h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          • Increase gas fees for faster transaction execution
                        </li>
                        <li>
                          • Check for sufficient liquidity in target tokens
                        </li>
                        <li>• Verify wallet has adequate balance for trades</li>
                        <li>• Monitor network congestion and adjust timing</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Low Profitability</h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          • Lower profit thresholds to capture more
                          opportunities
                        </li>
                        <li>
                          • Increase position sizes (with proper risk
                          management)
                        </li>
                        <li>
                          • Optimize gas fee strategies for better margins
                        </li>
                        <li>
                          • Focus on higher volatility periods for more
                          opportunities
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="monitoring">
                  <AccordionTrigger>
                    Performance Monitoring & Optimization
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Key Metrics to Track
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>
                            <strong>Token Balance:</strong> Current holdings
                            from successful snipes
                          </p>
                          <p>
                            <strong>Success Rate:</strong> Percentage of
                            successful vs failed snipes
                          </p>
                          <p>
                            <strong>Profit Per Trade:</strong> Average profit
                            generated per successful snipe
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Execution Speed:</strong> Time from
                            opportunity detection to execution
                          </p>
                          <p>
                            <strong>Gas Efficiency:</strong> Gas costs vs
                            profits generated
                          </p>
                          <p>
                            <strong>Market Coverage:</strong> Number of
                            opportunities detected vs executed
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Optimization Tips</h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          • Start with small amounts to learn the bot's behavior
                        </li>
                        <li>
                          • Monitor performance closely in the first few days
                        </li>
                        <li>
                          • Adjust risk parameters based on market conditions
                        </li>
                        <li>
                          • Keep detailed records of successful strategies
                        </li>
                        <li>• Regularly review and update profit thresholds</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Important Considerations */}
          <Card className="border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-5 w-5" />
                Important Considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <strong>Resource Intensive:</strong> The Bundle Snipe Bot is
                resource-intensive and may affect other bots' performance
              </p>
              <p>
                <strong>Advanced Tool:</strong> This is an advanced bot
                requiring good understanding of trading concepts
              </p>
              <p>
                <strong>Risk Management:</strong> Always start with conservative
                settings and small amounts
              </p>
              <p>
                <strong>Market Dependent:</strong> Performance varies
                significantly based on market conditions
              </p>
              <p>
                <strong>Continuous Learning:</strong> Requires ongoing
                monitoring and strategy adjustment
              </p>
            </CardContent>
          </Card>

          {/* Quick Start CTA */}
          <Card className="border bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Ready to Start Bundle Sniping?
                </h3>
                <p className="text-muted-foreground">
                  Begin with simulation mode and conservative settings to learn
                  the system
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/projects">Go to Projects</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/faqs">View FAQs</Link>
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
