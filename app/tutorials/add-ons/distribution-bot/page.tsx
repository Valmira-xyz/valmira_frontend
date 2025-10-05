'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  HelpCircle,
  Send,
  Settings,
  Target,
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

export default function DistributionBotTutorial() {
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
      title: 'Configure Distribution Bot',
      description: 'Set up source wallets and distribution parameters',
      icon: Settings,
    },
    {
      title: 'Set Target Wallets',
      description: 'Define recipient wallets and distribution amounts',
      icon: Target,
    },
    {
      title: 'Execute Distribution',
      description: 'Bot distributes tokens automatically to recipients',
      icon: Send,
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
              Distribution Bot Tutorial
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Distribution Bot Complete Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Efficiently distribute tokens to multiple wallets with automated
              batch processing and gas optimization
            </p>
          </div>

          {/* What & Why Section */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                What is the Distribution Bot and Why Use It?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">What It Does</h3>
                <p className="text-muted-foreground mb-4">
                  The Distribution Bot is your bulk token distribution solution.
                  It automatically sends tokens to hundreds of wallet addresses
                  in efficient batches, saving you time and transaction fees.
                  Whether you're distributing tokens to community members,
                  conducting airdrops, or managing token allocations, this bot
                  handles it all.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">🔄 Key Capabilities:</p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Bulk Distribution:</strong> Send tokens to up to
                      100 wallets per batch
                    </li>
                    <li>
                      <strong>Gas Optimization:</strong> Minimizes transaction
                      costs through efficient batch processing
                    </li>
                    <li>
                      <strong>Flexible Distribution:</strong> Choose between
                      equal amounts or random amounts per wallet
                    </li>
                    <li>
                      <strong>Source Flexibility:</strong> Use tokens from
                      sniping wallets or import your own wallet list
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
                        <p className="font-medium">Time Savings</p>
                        <p className="text-sm text-muted-foreground">
                          Distribute to hundreds of wallets in minutes instead
                          of hours
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Cost Efficiency</p>
                        <p className="text-sm text-muted-foreground">
                          Batch processing reduces gas fees by up to 90%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Accuracy</p>
                        <p className="text-sm text-muted-foreground">
                          Automated distribution eliminates human error
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Professional Airdrops</p>
                        <p className="text-sm text-muted-foreground">
                          Easily conduct community rewards and marketing
                          campaigns
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
                  <TabsTrigger value="advanced">
                    Distribution Options
                  </TabsTrigger>
                  <TabsTrigger value="sources">Source Types</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Default Parameters</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Max Target Wallets:</span>
                          <code className="bg-muted px-2 py-1 rounded">
                            100 per batch
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span>Min Target Wallets:</span>
                          <code className="bg-muted px-2 py-1 rounded">1</code>
                        </div>
                        <div className="flex justify-between">
                          <span>Time Between Transactions:</span>
                          <code className="bg-muted px-2 py-1 rounded">
                            5 seconds
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span>Default Status:</span>
                          <Badge variant="secondary">Inactive</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">
                        Distribution Tracking
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Completed Distributions:</span>
                          <span className="font-medium">
                            Real-time tracking
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Distributions:</span>
                          <span className="font-medium">
                            Progress monitoring
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span className="font-medium">
                            Performance metrics
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <Alert>
                    <BarChart3 className="h-4 w-4" />
                    <AlertTitle>Distribution Strategies</AlertTitle>
                    <AlertDescription>
                      Choose the distribution method that best fits your
                      campaign goals.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Equal Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>
                            <strong>Use Case:</strong> Fair airdrops, community
                            rewards
                          </p>
                          <p>
                            <strong>Method:</strong> Same amount to every wallet
                          </p>
                          <p>
                            <strong>Benefits:</strong> Simple, transparent, fair
                          </p>
                          <p>
                            <strong>Best For:</strong> Community building,
                            loyalty rewards
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Random Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>
                            <strong>Use Case:</strong> Natural-looking
                            distributions
                          </p>
                          <p>
                            <strong>Method:</strong> Varied amounts between
                            min/max values
                          </p>
                          <p>
                            <strong>Benefits:</strong> Appears more organic
                          </p>
                          <p>
                            <strong>Best For:</strong> Simulating natural token
                            spread
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sources" className="space-y-4">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">
                        Source Wallet Types
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1">
                              🎯
                            </Badge>
                            <div>
                              <p className="font-medium">Sniping Wallets</p>
                              <p className="text-sm text-muted-foreground">
                                Use tokens from Bundle Snipe Bot wallets
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1">
                              📁
                            </Badge>
                            <div>
                              <p className="font-medium">Imported Wallets</p>
                              <p className="text-sm text-muted-foreground">
                                Upload CSV file with your own wallet list
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="font-medium mb-2">CSV File Format</p>
                            <div className="bg-muted p-3 rounded text-sm font-mono">
                              address,amount
                              <br />
                              0x123...,1000
                              <br />
                              0x456...,2000
                            </div>
                          </div>
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
                            2. Find the Distribution Bot in the "Add-ons"
                            section
                          </p>
                          <p>3. Toggle the switch to "ON"</p>
                          <p>
                            4. Choose source wallet type (sniping or imported)
                          </p>
                          <p>
                            5. Set time between transactions (default: 5
                            seconds)
                          </p>
                        </div>
                      )}

                      {index === 1 && (
                        <div className="space-y-2 text-sm">
                          <p>1. Set target wallet count (1-100 per batch)</p>
                          <p>2. Choose distribution style:</p>
                          <p className="ml-4">
                            • Equal: Same amount to all wallets
                          </p>
                          <p className="ml-4">
                            • Random: Varied amounts between min/max
                          </p>
                          <p>3. Upload CSV file if using imported wallets</p>
                          <p>4. Review distribution parameters</p>
                        </div>
                      )}

                      {index === 2 && (
                        <div className="space-y-2 text-sm">
                          <p>1. Ensure source wallets have sufficient tokens</p>
                          <p>2. Verify target wallet addresses are correct</p>
                          <p>3. Click "Execute" to start distribution</p>
                          <p>4. Monitor progress in real-time</p>
                          <p>5. Track completed vs total distributions</p>
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
                    Distribution Bot Strategies
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Powerful Bot Combinations
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Distribution + Holder Bot:</strong> Create
                          holders then distribute additional tokens to them
                        </li>
                        <li>
                          <strong>Distribution + Volume Bot:</strong> Distribute
                          tokens while maintaining trading activity
                        </li>
                        <li>
                          <strong>Distribution + Snipe Bot:</strong> Use sniped
                          tokens as the source for distribution
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Campaign Types</h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Community Airdrops:</strong> Equal
                          distribution to reward loyal community members
                        </li>
                        <li>
                          <strong>Marketing Campaigns:</strong> Random
                          distribution to create buzz and engagement
                        </li>
                        <li>
                          <strong>Liquidity Incentives:</strong> Distribute to
                          liquidity providers as rewards
                        </li>
                        <li>
                          <strong>Holder Rewards:</strong> Distribute additional
                          tokens to existing holders
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
                        Distribution Failures
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          • Verify source wallets have sufficient token balance
                        </li>
                        <li>
                          • Check that all target wallet addresses are valid
                        </li>
                        <li>
                          • Ensure adequate gas fees for batch transactions
                        </li>
                        <li>• Confirm network connectivity and stability</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Slow Distribution Speed
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          • Reduce time between transactions for faster
                          processing
                        </li>
                        <li>
                          • Use smaller batch sizes during network congestion
                        </li>
                        <li>
                          • Switch to BSC for faster transaction confirmation
                        </li>
                        <li>
                          • Monitor gas prices and adjust timing accordingly
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">High Gas Costs</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Use BSC instead of Ethereum for lower fees</li>
                        <li>
                          • Increase batch sizes to reduce per-transaction costs
                        </li>
                        <li>• Schedule distributions during low gas periods</li>
                        <li>
                          • Consider splitting large distributions across
                          multiple sessions
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
                            <strong>Completed Distributions:</strong> Number of
                            successful token transfers
                          </p>
                          <p>
                            <strong>Total Distributions:</strong> Total planned
                            distributions in the campaign
                          </p>
                          <p>
                            <strong>Success Rate:</strong> Percentage of
                            successful vs failed distributions
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Average Gas Cost:</strong> Cost efficiency
                            per distribution
                          </p>
                          <p>
                            <strong>Distribution Speed:</strong> Tokens
                            distributed per minute/hour
                          </p>
                          <p>
                            <strong>Wallet Coverage:</strong> Number of unique
                            wallets reached
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Optimization Tips</h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          • Test with small batches before large distributions
                        </li>
                        <li>
                          • Keep CSV files organized and regularly updated
                        </li>
                        <li>
                          • Monitor recipient wallet activity post-distribution
                        </li>
                        <li>• Track community engagement and feedback</li>
                        <li>
                          • Document successful distribution strategies for
                          future campaigns
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
                  Ready to Start Distributing Tokens?
                </h3>
                <p className="text-muted-foreground">
                  Begin with a small test batch to familiarize yourself with the
                  process
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
