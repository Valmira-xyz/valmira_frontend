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

export default function VolumeBotTutorialPage() {
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
      title: 'Enable Volume Bot',
      description: 'Activate the bot in your project dashboard',
      icon: Settings,
    },
    {
      title: 'Configure Parameters',
      description: 'Set trading amounts and timing',
      icon: BarChart3,
    },
    {
      title: 'Fund & Execute',
      description: 'Deposit funds and start generating volume',
      icon: Zap,
    },
  ];

  // const features = [
  //   {
  //     icon: TrendingUp,
  //     title: 'Organic Trading Patterns',
  //     description: 'Creates natural-looking buy and sell activity using multiple wallets',
  //   },
  //   {
  //     icon: BarChart3,
  //     title: 'Dual Bot System',
  //     description: 'Splits deposits into micro and larger trades for realistic volume',
  //   },
  //   {
  //     icon: Zap,
  //     title: 'Customizable Speed',
  //     description: 'Adjust transaction frequency and amounts to match your strategy',
  //   },
  // ];

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
              Volume Bot Tutorial
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Volume Bot Complete Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Generate natural-looking trading activity to boost your token's
              market presence and rankings
            </p>
          </div>

          {/* What & Why Section */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                What is the Volume Bot and Why Use It?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">What It Does</h3>
                <p className="text-muted-foreground mb-4">
                  The Volume Bot is your token's activity generator. It creates
                  natural-looking trading activity by automatically buying and
                  selling your token using multiple wallets. Think of it as
                  having dozens of traders constantly showing interest in your
                  token.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">🔄 Dual Bot System:</p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Bot 1:</strong> Makes many small purchases using
                      different wallets, then sells them in bundles
                    </li>
                    <li>
                      <strong>Bot 2:</strong> Makes larger purchases with
                      different wallets, then sells them in bundles
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
                        <p className="font-medium">Boost Rankings</p>
                        <p className="text-sm text-muted-foreground">
                          Higher volume = better rankings on DexTools, CoinGecko
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Increase Confidence</p>
                        <p className="text-sm text-muted-foreground">
                          Active trading signals legitimacy to potential
                          investors
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Exchange Requirements</p>
                        <p className="text-sm text-muted-foreground">
                          Meet minimum volume requirements for listings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Price Stability</p>
                        <p className="text-sm text-muted-foreground">
                          More activity typically leads to more stable prices
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
                  <TabsTrigger value="advanced">Advanced Config</TabsTrigger>
                  <TabsTrigger value="networks">Network Support</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Default Parameters</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Min Native Amount:</span>
                          <code className="bg-muted px-2 py-1 rounded">
                            0.001
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Native Amount:</span>
                          <code className="bg-muted px-2 py-1 rounded">
                            0.005
                          </code>
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
                        Minimum Requirements
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>BSC Projects:</span>
                          <span className="font-medium">0.1 BNB minimum</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ETH Projects:</span>
                          <span className="font-medium">0.05 ETH minimum</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Token Compatibility:</span>
                          <span className="font-medium">PancakeSwap V2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Advanced Configuration</AlertTitle>
                    <AlertDescription>
                      These settings require understanding of trading mechanics.
                      Start with defaults for best results.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">
                        Customizable Parameters
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <p>
                            <strong>Transaction Amounts:</strong> Adjust min/max
                            native amounts for different trade sizes
                          </p>
                          <p>
                            <strong>Timing Control:</strong> Modify intervals
                            between transactions (minimum 1 second)
                          </p>
                          <p>
                            <strong>Volume Tracking:</strong> Monitor generated
                            volume in real-time
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p>
                            <strong>Wallet Management:</strong> Bot
                            automatically creates and manages sub-wallets
                          </p>
                          <p>
                            <strong>Gas Optimization:</strong> Smart gas fee
                            management for cost efficiency
                          </p>
                          <p>
                            <strong>Pattern Variation:</strong> Randomized
                            trading patterns for natural appearance
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="networks" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          BSC (Recommended)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p>
                          <strong>Network:</strong> Binance Smart Chain
                        </p>
                        <p>
                          <strong>DEX:</strong> PancakeSwap V2
                        </p>
                        <p>
                          <strong>Native Currency:</strong> BNB
                        </p>
                        <p>
                          <strong>Advantages:</strong> Lower fees, faster
                          transactions
                        </p>
                        <p>
                          <strong>Best For:</strong> New projects,
                          cost-conscious users
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Ethereum</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p>
                          <strong>Network:</strong> Ethereum Mainnet
                        </p>
                        <p>
                          <strong>DEX:</strong> Uniswap V2
                        </p>
                        <p>
                          <strong>Native Currency:</strong> ETH
                        </p>
                        <p>
                          <strong>Advantages:</strong> Larger ecosystem, more
                          visibility
                        </p>
                        <p>
                          <strong>Best For:</strong> Established projects,
                          higher budgets
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Step-by-Step Setup */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
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
                          <p>2. Find the Volume Bot in the "Add-ons" section</p>
                          <p>3. Toggle the switch to "ON"</p>
                          <p>
                            4. The system will create a dedicated deposit wallet
                          </p>
                        </div>
                      )}

                      {index === 1 && (
                        <div className="space-y-2 text-sm">
                          <p>
                            1. Set minimum trade amount (default: 0.001 native
                            currency)
                          </p>
                          <p>
                            2. Set maximum trade amount (default: 0.005 native
                            currency)
                          </p>
                          <p>
                            3. Configure time between transactions (default: 5
                            seconds)
                          </p>
                          <p>4. Review estimated fees and requirements</p>
                        </div>
                      )}

                      {index === 2 && (
                        <div className="space-y-2 text-sm">
                          <p>1. Copy the provided deposit wallet address</p>
                          <p>
                            2. Send native currency (BNB/ETH) to this address
                          </p>
                          <p>3. Wait for confirmation (1-3 minutes)</p>
                          <p>4. Click "Execute" to start the bot</p>
                          <p>5. Monitor progress in your dashboard</p>
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
                    Advanced Volume Strategies
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Optimal Bot Combinations
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Volume + Holder Bot:</strong> Creates both
                          trading activity and diverse holder base
                        </li>
                        <li>
                          <strong>Volume + Auto Sell Bot:</strong> Generates
                          activity while protecting profits
                        </li>
                        <li>
                          <strong>Volume + Distribution Bot:</strong> Maintains
                          activity during token distributions
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Timing Strategies</h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Launch Phase:</strong> Use higher frequency
                          (3-5 second intervals) for initial momentum
                        </li>
                        <li>
                          <strong>Growth Phase:</strong> Moderate frequency
                          (5-10 seconds) for sustained activity
                        </li>
                        <li>
                          <strong>Maintenance:</strong> Lower frequency (10+
                          seconds) for ongoing presence
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="troubleshooting">
                  <AccordionTrigger>Common Issues & Solutions</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Bot Not Starting</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Ensure sufficient funds in deposit wallet</li>
                        <li>• Check that token has liquidity on the DEX</li>
                        <li>• Verify network connection and gas fees</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Low Volume Generation
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Increase max trade amounts</li>
                        <li>• Reduce time between transactions</li>
                        <li>• Add more funding to the deposit wallet</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">High Gas Costs</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Switch to BSC for lower fees</li>
                        <li>
                          • Increase transaction intervals during high gas
                          periods
                        </li>
                        <li>• Monitor network congestion before starting</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="monitoring">
                  <AccordionTrigger>Performance Monitoring</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Key Metrics to Track
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>
                            <strong>Generated Volume:</strong> Total trading
                            volume created
                          </p>
                          <p>
                            <strong>Transaction Count:</strong> Number of trades
                            executed
                          </p>
                          <p>
                            <strong>Active Wallets:</strong> Number of wallets
                            currently trading
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Cost Efficiency:</strong> Volume generated
                            per native currency spent
                          </p>
                          <p>
                            <strong>Bot Status:</strong> Active/Inactive status
                            monitoring
                          </p>
                          <p>
                            <strong>Balance Tracking:</strong> Remaining funds
                            in deposit wallet
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Optimization Tips</h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          • Monitor performance for 24-48 hours before adjusting
                          settings
                        </li>
                        <li>
                          • Track your token's ranking improvements on tracking
                          sites
                        </li>
                        <li>• Adjust parameters based on market conditions</li>
                        <li>
                          • Consider pausing during extreme market volatility
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
                  Ready to Boost Your Token's Volume?
                </h3>
                <p className="text-muted-foreground">
                  Start with the recommended settings and scale up as you see
                  results
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
