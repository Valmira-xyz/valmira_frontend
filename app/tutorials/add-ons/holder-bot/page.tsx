'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
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

export default function HolderBotTutorialPage() {
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
      title: 'Enable Holder Bot',
      description: 'Activate the bot and set target holder count',
      icon: Settings,
    },
    {
      title: 'Fund the Bot',
      description: 'Deposit native currency for wallet creation',
      icon: Wallet,
    },
    {
      title: 'Execute & Monitor',
      description: 'Start holder generation and track progress',
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
              Holder Bot Tutorial
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Holder Bot Complete Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create a diverse and natural-looking holder base to improve your
              token's metrics and investor confidence
            </p>
          </div>

          {/* What & Why Section */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                What is the Holder Bot and Why Use It?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">What It Does</h3>
                <p className="text-muted-foreground mb-4">
                  The Holder Bot creates a diverse and natural-looking holder
                  base for your token by generating multiple unique wallets and
                  distributing tokens among them. Instead of having just a few
                  large holders, your token will appear to have hundreds of
                  individual investors, each holding different amounts.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">🔄 How It Works:</p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Step 1:</strong> You deposit native currency (BNB,
                      ETH, etc.) to fund the operation
                    </li>
                    <li>
                      <strong>Step 2:</strong> The bot creates multiple new
                      wallets automatically
                    </li>
                    <li>
                      <strong>Step 3:</strong> It distributes your tokens across
                      these wallets in natural-looking patterns
                    </li>
                    <li>
                      <strong>Step 4:</strong> Each wallet appears as a unique
                      holder on blockchain explorers
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
                        <p className="font-medium">Improved Token Metrics</p>
                        <p className="text-sm text-muted-foreground">
                          Higher holder counts on DexTools and tracking
                          platforms
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Increased Attractiveness</p>
                        <p className="text-sm text-muted-foreground">
                          More holders signal community adoption to investors
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Better Distribution</p>
                        <p className="text-sm text-muted-foreground">
                          Creates appearance of widespread token adoption
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Reduced Risk Perception</p>
                        <p className="text-sm text-muted-foreground">
                          Many small holders appear less risky than few large
                          ones
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
                  <TabsTrigger value="advanced">Advanced Features</TabsTrigger>
                  <TabsTrigger value="ui">Dashboard UI</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Default Parameters</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Generated Holders:</span>
                          <code className="bg-muted px-2 py-1 rounded">
                            0 (default)
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span>Target Holders:</span>
                          <code className="bg-muted px-2 py-1 rounded">
                            Configurable
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span>Default Status:</span>
                          <Badge variant="secondary">Inactive</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Supported Networks:</span>
                          <span className="font-medium">BSC, ETH</span>
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
                          <span className="font-medium">0.3 BNB minimum</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ETH Projects:</span>
                          <span className="font-medium">0.1 ETH minimum</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recommended Start:</span>
                          <span className="font-medium">50-100 holders</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Advanced Features Available</AlertTitle>
                    <AlertDescription>
                      These features create more realistic and natural-looking
                      holder distributions.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">
                          Distribution Features
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="font-medium">
                              Time-Delayed Distribution
                            </p>
                            <p className="text-muted-foreground">
                              Spread holder creation over hours or days for
                              organic growth appearance
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">
                              Natural Distribution Pattern
                            </p>
                            <p className="text-muted-foreground">
                              Varied amounts per wallet to simulate real
                              investor behavior
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Wallet Features</h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="font-medium">
                              Transaction History Generation
                            </p>
                            <p className="text-muted-foreground">
                              Create realistic transaction histories for each
                              wallet
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">
                              Wallet Activity Simulation
                            </p>
                            <p className="text-muted-foreground">
                              Small buys/sells over time to simulate real user
                              behavior
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">
                        Customization Options
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Custom Address Integration:</strong> Include
                          your own wallets in the distribution pattern
                        </p>
                        <p>
                          <strong>Flexible Targeting:</strong> Set specific
                          holder count goals based on your project needs
                        </p>
                        <p>
                          <strong>Real-time Monitoring:</strong> Track holder
                          generation progress in your dashboard
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ui" className="space-y-4">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Dashboard Elements</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1">
                              📊
                            </Badge>
                            <div>
                              <p className="font-medium">Status Badge</p>
                              <p className="text-sm text-muted-foreground">
                                Shows whether the bot is Active or Inactive
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1">
                              💼
                            </Badge>
                            <div>
                              <p className="font-medium">Deposit Wallet</p>
                              <p className="text-sm text-muted-foreground">
                                Address where you send native currency for
                                funding
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1">
                              👥
                            </Badge>
                            <div>
                              <p className="font-medium">Generated Holders</p>
                              <p className="text-sm text-muted-foreground">
                                Real-time count of holders created by the bot
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1">
                              🔄
                            </Badge>
                            <div>
                              <p className="font-medium">Execute Button</p>
                              <p className="text-sm text-muted-foreground">
                                Start the holder generation process after
                                funding
                              </p>
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
                          <p>2. Find the Holder Bot in the "Add-ons" section</p>
                          <p>3. Toggle the switch to "ON"</p>
                          <p>
                            4. Set your target holder count (start with 50-100)
                          </p>
                          <p>
                            5. The system will create a dedicated deposit wallet
                          </p>
                        </div>
                      )}

                      {index === 1 && (
                        <div className="space-y-2 text-sm">
                          <p>1. Copy the provided deposit wallet address</p>
                          <p>2. Send native currency to this address:</p>
                          <p className="ml-4">• BSC: Minimum 0.3 BNB</p>
                          <p className="ml-4">• ETH: Minimum 0.1 ETH</p>
                          <p>3. Wait for confirmation (1-3 minutes)</p>
                          <p>4. Verify funds appear in the bot's balance</p>
                        </div>
                      )}

                      {index === 2 && (
                        <div className="space-y-2 text-sm">
                          <p>
                            1. Click "Execute" to start the holder generation
                          </p>
                          <p>
                            2. Monitor progress in real-time on your dashboard
                          </p>
                          <p>3. Watch the "Generated Holders" count increase</p>
                          <p>
                            4. Check your token's holder count on blockchain
                            explorers
                          </p>
                          <p>
                            5. Verify improved metrics on tracking platforms
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
                    Optimal Holder Bot Strategies
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Recommended Bot Combinations
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Holder + Volume Bot:</strong> Creates both
                          holder diversity and trading activity
                        </li>
                        <li>
                          <strong>Holder + Distribution Bot:</strong> Builds
                          holder base while managing token distribution
                        </li>
                        <li>
                          <strong>Holder + Auto Sell Bot:</strong> Maintains
                          holder count while managing profit-taking
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Scaling Strategies</h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Phase 1:</strong> Start with 50-100 holders to
                          test the system
                        </li>
                        <li>
                          <strong>Phase 2:</strong> Scale to 200-500 holders for
                          improved metrics
                        </li>
                        <li>
                          <strong>Phase 3:</strong> Reach 1000+ holders for
                          maximum impact on rankings
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Timing Considerations
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Pre-Launch:</strong> Build holder base before
                          public announcement
                        </li>
                        <li>
                          <strong>Launch Day:</strong> Activate during launch
                          for immediate credibility
                        </li>
                        <li>
                          <strong>Growth Phase:</strong> Gradually increase
                          holders to match organic growth
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
                        Bot Not Generating Holders
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          • Ensure sufficient native currency in deposit wallet
                        </li>
                        <li>
                          • Check that your token has sufficient supply for
                          distribution
                        </li>
                        <li>
                          • Verify network connectivity and gas fee availability
                        </li>
                        <li>• Confirm target holder count is set correctly</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Slow Holder Generation
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Increase funding to speed up wallet creation</li>
                        <li>
                          • Check network congestion (BSC is typically faster)
                        </li>
                        <li>
                          • Reduce target holder count for faster completion
                        </li>
                        <li>
                          • Monitor gas prices and adjust timing accordingly
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">High Costs</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Switch to BSC for significantly lower fees</li>
                        <li>
                          • Start with smaller holder counts and scale gradually
                        </li>
                        <li>• Monitor network gas prices before executing</li>
                        <li>
                          • Consider time-delayed distribution to spread costs
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
                            <strong>Generated Holders:</strong> Current number
                            of holders created
                          </p>
                          <p>
                            <strong>Target Progress:</strong> Percentage of
                            target holder count achieved
                          </p>
                          <p>
                            <strong>Creation Rate:</strong> Holders generated
                            per hour/day
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Cost Efficiency:</strong> Cost per holder
                            generated
                          </p>
                          <p>
                            <strong>Platform Rankings:</strong> Improved
                            position on tracking sites
                          </p>
                          <p>
                            <strong>Investor Perception:</strong> Community
                            feedback and engagement
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Optimization Tips</h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          • Monitor your token's ranking improvements on
                          DexTools
                        </li>
                        <li>
                          • Track holder count changes on blockchain explorers
                        </li>
                        <li>• Combine with Volume Bot for maximum impact</li>
                        <li>
                          • Use time-delayed distribution for natural growth
                          appearance
                        </li>
                        <li>
                          • Consider market conditions when planning holder
                          generation
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
                  Ready to Build Your Holder Base?
                </h3>
                <p className="text-muted-foreground">
                  Start with 50-100 holders and scale up based on your project's
                  growth
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
