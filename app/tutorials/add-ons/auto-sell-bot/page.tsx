'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Settings,
  Target,
  Wallet,
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

export default function AutoSellBotTutorial() {
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
      title: 'Configure Auto Sell Bot',
      description: 'Set up wallet monitoring and basic parameters',
      icon: Settings,
    },
    {
      title: 'Set Price Targets',
      description: 'Define profit targets and stop-loss levels for each wallet',
      icon: Target,
    },
    {
      title: 'Activate & Monitor',
      description: 'Enable automatic selling and track performance',
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
              Auto Sell Bot Tutorial
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Auto Sell Bot Complete Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Automated profit protection system that monitors your token
              holdings and executes sells at optimal prices
            </p>
          </div>

          {/* What & Why Section */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                What is the Auto Sell Bot and Why Use It?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">What It Does</h3>
                <p className="text-muted-foreground mb-4">
                  The Auto Sell Bot is your automated profit protection system.
                  It monitors your token holdings across multiple wallets and
                  automatically sells them when they reach your target price or
                  hit your stop-loss level. Think of it as having a professional
                  trader watching your investments 24/7.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">🔄 Key Features:</p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Profit Target Automation:</strong> Automatically
                      sells when tokens reach your desired profit level
                    </li>
                    <li>
                      <strong>Stop-Loss Protection:</strong> Prevents major
                      losses by selling if prices drop too far
                    </li>
                    <li>
                      <strong>Multi-Wallet Management:</strong> Monitors and
                      manages tokens across all your wallets
                    </li>
                    <li>
                      <strong>Customizable Settings:</strong> Set different sell
                      prices and stop-losses for each wallet
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
                        <p className="font-medium">Automated Profit Taking</p>
                        <p className="text-sm text-muted-foreground">
                          Never miss a profit opportunity again
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Loss Protection</p>
                        <p className="text-sm text-muted-foreground">
                          Stop-losses prevent catastrophic losses
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Stress Reduction</p>
                        <p className="text-sm text-muted-foreground">
                          Sleep peacefully knowing your investments are
                          protected
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">24/7 Monitoring</p>
                        <p className="text-sm text-muted-foreground">
                          The bot never sleeps, never misses opportunities
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
                Technical Configuration & Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="advanced">Wallet Management</TabsTrigger>
                  <TabsTrigger value="statuses">Bot Statuses</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Default Parameters</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Total Token Balance:</span>
                          <code className="bg-muted px-2 py-1 rounded">
                            0 (default)
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Wallets Count:</span>
                          <code className="bg-muted px-2 py-1 rounded">
                            0 (default)
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span>Default Status:</span>
                          <Badge variant="secondary">ready_to_autosell</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Wallet Enabled:</span>
                          <code className="bg-muted px-2 py-1 rounded">
                            true (default)
                          </code>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">
                        Recommended Settings for Beginners
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Profit Target:</span>
                          <span className="font-medium">
                            50-100% above purchase price
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stop-Loss:</span>
                          <span className="font-medium">
                            20-30% below purchase price
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price Monitoring:</span>
                          <span className="font-medium">
                            Real-time checking
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <Alert>
                    <Wallet className="h-4 w-4" />
                    <AlertTitle>Multi-Wallet Configuration</AlertTitle>
                    <AlertDescription>
                      The Auto Sell Bot can manage multiple wallets
                      simultaneously, each with individual settings.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">
                        Wallet Configuration Options
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <p>
                            <strong>Individual Sell Prices:</strong> Set
                            different profit targets for each wallet
                          </p>
                          <p>
                            <strong>Custom Stop-Losses:</strong> Configure
                            unique stop-loss levels per wallet
                          </p>
                          <p>
                            <strong>Wallet Enable/Disable:</strong> Control
                            which wallets are actively monitored
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p>
                            <strong>Original Purchase Cost Tracking:</strong>{' '}
                            Track profit/loss calculations accurately
                          </p>
                          <p>
                            <strong>Wallet Address Management:</strong> Monitor
                            specific wallet addresses
                          </p>
                          <p>
                            <strong>Balance Monitoring:</strong> Real-time token
                            balance tracking per wallet
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">
                        Advanced Strategies
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Tiered Selling:</strong> Set different profit
                          targets for different wallets
                        </p>
                        <p>
                          <strong>Trailing Stop-Loss:</strong> Adjust stop-loss
                          as price increases (manual adjustment)
                        </p>
                        <p>
                          <strong>Partial Selling:</strong> Sell portions at
                          different price levels using multiple wallets
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="statuses" className="space-y-4">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">
                        Bot Status Meanings
                      </h4>
                      <div className="grid gap-3">
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Badge variant="secondary">ready_to_autosell</Badge>
                          <span className="text-sm">
                            Bot is configured and ready to monitor prices
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Badge variant="default">auto_selling</Badge>
                          <span className="text-sm">
                            Bot is actively monitoring and ready to execute
                            sells
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Badge variant="outline">selling</Badge>
                          <span className="text-sm">
                            Bot is currently executing a sell transaction
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Badge variant="destructive">sell_failed</Badge>
                          <span className="text-sm">
                            A sell transaction failed (check gas fees,
                            liquidity)
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Badge className="bg-green-500">sell_succeeded</Badge>
                          <span className="text-sm">
                            Sell transaction completed successfully
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Badge className="bg-blue-500">sold_all</Badge>
                          <span className="text-sm">
                            All tokens have been sold successfully
                          </span>
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
                            2. Find the Auto Sell Bot in the "Add-ons" section
                          </p>
                          <p>
                            3. The bot automatically detects wallets with token
                            holdings
                          </p>
                          <p>
                            4. Review the total token balance and active wallet
                            count
                          </p>
                          <p>
                            5. Verify the bot status shows "ready_to_autosell"
                          </p>
                          <h4 className="font-semibold mb-2">
                            Optimal Bot Combinations
                          </h4>
                          <ul className="space-y-2 text-sm">
                            <li>
                              <strong>Auto Sell + Snipe Bot:</strong>{' '}
                              Automatically sell sniped tokens at optimal prices
                            </li>
                            <li>
                              <strong>Auto Sell + Volume Bot:</strong> Protect
                              profits while maintaining trading activity
                            </li>
                            <li>
                              <strong>Auto Sell + Holder Bot:</strong> Manage
                              profits from holder wallets
                            </li>
                          </ul>
                        </div>
                      )}

                      {index === 1 && (
                        <div className="space-y-2 text-sm">
                          <p>1. For each wallet, set your sell price target</p>
                          <p>
                            2. Configure stop-loss levels (recommended: 20-30%
                            below purchase)
                          </p>
                          <p>3. Enable/disable individual wallets as needed</p>
                          <p>
                            4. Consider the original purchase cost for profit
                            calculations
                          </p>
                          <p>5. Review all settings before activation</p>
                        </div>
                      )}

                      {index === 2 && (
                        <div className="space-y-2 text-sm">
                          <p>1. Activate the bot to start price monitoring</p>
                          <p>2. Monitor the bot status for any changes</p>
                          <p>
                            3. Watch for "auto_selling" status indicating active
                            monitoring
                          </p>
                          <p>
                            4. Check for successful sells ("sell_succeeded"
                            status)
                          </p>
                          <p>
                            5. Review performance and adjust settings as needed
                          </p>
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
                    Advanced Auto Sell Strategies
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Optimal Bot Combinations
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Auto Sell + Snipe Bot:</strong> Automatically
                          sell sniped tokens at optimal prices
                        </li>
                        <li>
                          <strong>Auto Sell + Volume Bot:</strong> Protect
                          profits while maintaining trading activity
                        </li>
                        <li>
                          <strong>Auto Sell + Holder Bot:</strong> Manage
                          profits from holder wallets
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Risk Management Strategies
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Conservative:</strong> 30-50% profit targets,
                          15-20% stop-losses
                        </li>
                        <li>
                          <strong>Moderate:</strong> 50-100% profit targets,
                          20-30% stop-losses
                        </li>
                        <li>
                          <strong>Aggressive:</strong> 100%+ profit targets,
                          30-40% stop-losses
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Market Condition Adjustments
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Bull Market:</strong> Higher profit targets,
                          looser stop-losses
                        </li>
                        <li>
                          <strong>Bear Market:</strong> Lower profit targets,
                          tighter stop-losses
                        </li>
                        <li>
                          <strong>Volatile Market:</strong> Moderate targets,
                          quick profit-taking
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
                        Bot Not Executing Sells
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          • Check that wallets are enabled and have token
                          balances
                        </li>
                        <li>
                          • Verify sell prices are set correctly (not too high)
                        </li>
                        <li>• Ensure adequate gas fees in wallets</li>
                        <li>
                          • Confirm token has sufficient liquidity for selling
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Sell Transactions Failing
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          • Increase gas fee settings for faster execution
                        </li>
                        <li>
                          • Check for slippage issues during high volatility
                        </li>
                        <li>
                          • Verify token contract allows selling (no honeypot)
                        </li>
                        <li>
                          • Ensure wallet has enough native currency for gas
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Missed Profit Opportunities
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Lower profit targets for more frequent sells</li>
                        <li>• Enable more wallets for broader coverage</li>
                        <li>• Monitor network congestion and adjust timing</li>
                        <li>• Consider partial selling strategies</li>
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
                            <strong>Total Token Balance:</strong> Current
                            holdings across all wallets
                          </p>
                          <p>
                            <strong>Active Wallets:</strong> Number of wallets
                            being monitored
                          </p>
                          <p>
                            <strong>Successful Sells:</strong> Number of
                            completed sell transactions
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Profit Realized:</strong> Total profits from
                            automated sells
                          </p>
                          <p>
                            <strong>Success Rate:</strong> Percentage of
                            successful vs failed sells
                          </p>
                          <p>
                            <strong>Average Sell Time:</strong> Time from
                            trigger to execution
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Optimization Tips</h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          • Start with conservative settings until you
                          understand the bot's behavior
                        </li>
                        <li>
                          • Never set stop-losses too tight (avoid getting
                          stopped out by normal volatility)
                        </li>
                        <li>
                          • Consider market conditions when setting targets
                        </li>
                        <li>
                          • Regularly review and adjust settings based on
                          performance
                        </li>
                        <li>
                          • Keep adequate gas fees in all monitored wallets
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Quick Start CTA */}
          <Card className="border bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Ready to Protect Your Profits?
                </h3>
                <p className="text-muted-foreground">
                  Start with conservative settings and adjust based on your risk
                  tolerance
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
