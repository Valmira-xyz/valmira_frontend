'use client';

import { useState } from 'react';
import React from 'react';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Gift,
  HelpCircle,
  Mail,
  MessageSquare,
  Share2,
  Star,
  Target,
  TrendingUp,
  Users,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AmbassadorGettingStartedTutorial() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: 'Join Ambassador Program',
      description: 'Sign up and get approved for the ambassador program',
      icon: Users,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">How to Join</h3>
          <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
            <li>
              Click on the &quot;Become an Ambassador&quot; button in your
              dashboard
            </li>
            <li>Complete the application form with your details</li>
            <li>Agree to the program terms and conditions</li>
            <li>Submit your application for review</li>
            <li>Get approved and receive your welcome email</li>
          </ol>
          <Alert className="mt-4">
            <AlertTitle>Approval Process</AlertTitle>
            <AlertDescription>
              Applications are typically reviewed within 1-2 business days.
              You'll receive an email notification once your application is
              approved.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      title: 'Set Up Payment Details',
      description: 'Configure your wallet for commission payments',
      icon: DollarSign,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Payment Setup</h3>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Supported Wallets</h4>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  MetaMask
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Trust Wallet
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  WalletConnect
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Coinbase Wallet
                </li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Payment Schedule</h4>
              <ul className="space-y-2 text-sm">
                <li>• Payments processed on the 1st of each month</li>
                <li>• Minimum payout: $50 (or equivalent in crypto)</li>
                <li>• No maximum limit on earnings</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Start Referring',
      description: 'Share your referral links and earn commissions',
      icon: TrendingUp,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Referral Tools</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Your Link</CardTitle>
                <CardDescription>
                  Copy and share your unique referral link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://valmira.xyz/ref/your-username"
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted/50"
                  />
                  <Button size="sm">Copy</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Track Performance</CardTitle>
                <CardDescription>
                  Monitor your referrals and earnings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Referrals</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Referrals</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Earnings</span>
                  <span className="font-medium">$0.00</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4">
            <h4 className="font-medium mb-2">Sharing Options</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
  };

  const prevStep = () => {
    setActiveStep((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToStep = (index: number) => {
    setActiveStep(index);
  };

  const benefits = [
    {
      title: 'Recurring Revenue',
      description: 'Earn ongoing commissions from referred users',
      icon: DollarSign,
      details: [
        'Commission on all bot usage',
        'Monthly recurring payments',
        'No cap on earnings',
      ],
    },
    {
      title: 'Marketing Support',
      description: 'Get tools and resources to promote Valmira',
      icon: Target,
      details: [
        'Custom referral links',
        'Marketing materials',
        'Performance analytics',
      ],
    },
    {
      title: 'Community Recognition',
      description: 'Build your reputation in the crypto community',
      icon: Star,
      details: ['Ambassador badge', 'Leaderboard rankings', 'Exclusive access'],
    },
  ];

  // Commission structure - flat rates for all users
  // const commissionInfo = {
  //   level1: { rate: '10%', description: 'Direct referrals' },
  //   level2: { rate: '3%', description: 'Indirect referrals' },
  // };

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
              Ambassador Program Tutorial
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Valmira Ambassador Program Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how to join the Valmira Ambassador Program and start earning
              recurring revenue by referring new users
            </p>
          </div>

          {/* Step Navigation */}
          <div className="space-y-8">
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    {steps.map((step, index) => (
                      <React.Fragment key={index}>
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => goToStep(index)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                goToStep(index);
                              }
                            }}
                            className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                              index <= activeStep
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                            aria-label={`Go to step ${index + 1}: ${step.title}`}
                            aria-current={
                              index === activeStep ? 'step' : undefined
                            }
                          >
                            <step.icon className="h-5 w-5" />
                            {index < activeStep && (
                              <CheckCircle className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-background text-green-500" />
                            )}
                          </button>
                          <div
                            className={`mt-2 text-center text-xs font-medium ${
                              index === activeStep
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {step.title}
                          </div>
                        </div>
                        {index < steps.length - 1 && (
                          <div className="h-0.5 flex-1 bg-muted relative">
                            <div
                              className={`absolute left-0 top-0 h-full bg-primary transition-all duration-500 ${
                                index < activeStep ? 'w-full' : 'w-0'
                              }`}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {(() => {
                        const Icon = steps[activeStep].icon;
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        {steps[activeStep].title}
                      </CardTitle>
                      <CardDescription>
                        {steps[activeStep].description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>{steps[activeStep].content}</CardContent>
              </Card>
            </motion.div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={activeStep === 0}
                className={activeStep === 0 ? 'invisible' : ''}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button onClick={nextStep} className="ml-auto">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/dashboard/ambassador">
                    Go to Ambassador Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* What & Why Section */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                What is the Ambassador Program?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Program Overview</h3>
                <p className="text-muted-foreground mb-4">
                  The Valmira Ambassador Program is a revenue-sharing
                  partnership that allows you to earn recurring commissions by
                  referring new users to the platform. Think of it as becoming a
                  business partner with Valmira - you help grow the community
                  and get rewarded with a percentage of the revenue generated by
                  your referrals.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">As an Ambassador, You Get:</p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Recurring Commissions:</strong> Earn ongoing
                      revenue from all referred user activities
                    </li>
                    <li>
                      <strong>Simple, Transparent Rewards:</strong> All
                      ambassadors earn the same commission rates (10% direct, 3%
                      indirect) with no tiers or minimums.
                    </li>
                    <li>
                      <strong>Marketing Tools:</strong> Custom links, analytics,
                      and promotional materials
                    </li>
                    <li>
                      <strong>Community Status:</strong> Recognition and
                      exclusive access to new features
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Why Become an Ambassador?
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Passive Income</p>
                        <p className="text-sm text-muted-foreground">
                          Earn money while you sleep from active referrals
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">No Investment Required</p>
                        <p className="text-sm text-muted-foreground">
                          Start earning without any upfront costs
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Scalable Revenue</p>
                        <p className="text-sm text-muted-foreground">
                          No limit on how much you can earn
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Help Others Succeed</p>
                        <p className="text-sm text-muted-foreground">
                          Share valuable tools while earning rewards
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Overview */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Ambassador Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="border">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <benefit.icon className="h-6 w-6 text-primary" />
                        <CardTitle className="text-lg">
                          {benefit.title}
                        </CardTitle>
                      </div>
                      <CardDescription>{benefit.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm">
                        {benefit.details.map((detail, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Commission Structure */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Commission Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="rates" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rates">Commission Rates</TabsTrigger>
                  <TabsTrigger value="calculation">
                    How It's Calculated
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="rates" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Level 1 (Direct)
                          </CardTitle>
                          <Badge variant="default" className="bg-green-500">
                            10%
                          </Badge>
                        </div>
                        <CardDescription>
                          Earn from users you directly refer
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            10% of all fees generated
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            No minimum requirements
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Immediate earnings
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Level 2 (Indirect)
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className="border-blue-500 text-blue-500"
                          >
                            3%
                          </Badge>
                        </div>
                        <CardDescription>
                          Earn from your referrals' referrals
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            3% of second-level fees
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Passive income stream
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Network growth rewards
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertTitle>Equal Opportunity</AlertTitle>
                    <AlertDescription>
                      All ambassadors earn the same rates—10% for direct
                      referrals and 3% for indirect referrals. There are no
                      commission tiers or minimums. Start earning immediately
                      with your first referral!
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value="calculation" className="space-y-4">
                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertTitle>Commission Calculation</AlertTitle>
                    <AlertDescription>
                      Commissions are calculated based on the net revenue
                      generated by your referred users.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">
                        What Counts as Commission-Eligible Revenue
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Bot Usage Fees:</strong> All fees paid for bot
                          operations (Volume, Holder, Distribution, etc.)
                        </li>
                        <li>
                          <strong>Platform Fees:</strong> Service fees for using
                          Valmira features
                        </li>
                        <li>
                          <strong>Premium Features:</strong> Advanced tools and
                          analytics subscriptions
                        </li>
                        <li>
                          <strong>Transaction Fees:</strong> Platform fees on
                          successful bot transactions
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">
                        Example Calculation
                      </h4>
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                        <p>
                          <strong>Scenario:</strong> Ambassador with direct
                          referral (10% commission)
                        </p>
                        <p>
                          <strong>Referred User Activity:</strong> $1,000 in bot
                          fees this month
                        </p>
                        <p>
                          <strong>Your L1 Commission:</strong> $1,000 � 10% =
                          $100
                        </p>
                        <p>
                          <strong>Payment:</strong> Processed daily via
                          automated system
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Payment Schedule</h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Frequency:</strong> Daily automated processing
                          at 2 AM UTC
                        </li>
                        <li>
                          <strong>Auto-withdraw:</strong> Configurable threshold
                          for automatic payouts
                        </li>
                        <li>
                          <strong>Currency:</strong> USDT, USDC, ETH, or BNB
                          (your choice)
                        </li>
                        <li>
                          <strong>Tracking:</strong> Daily commission
                          calculation and balance updates
                        </li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Step-by-Step Getting Started */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Getting Started - Step by Step
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 p-4 rounded-lg border transition-colors ${
                      activeStep === index
                        ? 'bg-primary/5 border-primary'
                        : 'bg-muted/30'
                    }`}
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
                          <p>
                            1. Navigate to the Ambassador section in your
                            Valmira dashboard
                          </p>
                          <p>2. Click "Apply for Ambassador Program"</p>
                          <p>3. Fill out the application form with:</p>
                          <p className="ml-4">
                            - Your experience with crypto and DeFi
                          </p>
                          <p className="ml-4">
                            - Your marketing channels (social media, website,
                            etc.)
                          </p>
                          <p className="ml-4">
                            - Your target audience and reach
                          </p>
                          <p>
                            4. Submit application and wait for approval (usually
                            24-48 hours)
                          </p>
                          <p>
                            5. Receive welcome email with ambassador resources
                          </p>
                        </div>
                      )}

                      {index === 1 && (
                        <div className="space-y-2 text-sm">
                          <p>1. Go to Ambassador - Payment Settings</p>
                          <p>
                            2. Connect your preferred wallet for commission
                            payments
                          </p>
                          <p>
                            3. Choose payment currency (USDC recommended for
                            stability)
                          </p>
                          <p>
                            4. Set minimum payout threshold ($50-$500 range)
                          </p>
                          <p>
                            5. Verify payment details and save configuration
                          </p>
                          <p>
                            6. Test with a small transaction to ensure
                            everything works
                          </p>
                        </div>
                      )}

                      {index === 2 && (
                        <div className="space-y-2 text-sm">
                          <p>
                            1. Get your unique referral link from the dashboard
                          </p>
                          <p>2. Share on your preferred channels:</p>
                          <p className="ml-4">
                            - Social media (Twitter, Telegram, Discord)
                          </p>
                          <p className="ml-4">
                            - Content platforms (YouTube, blogs, newsletters)
                          </p>
                          <p className="ml-4">
                            - Direct outreach to potential users
                          </p>
                          <p>
                            3. Track performance in your ambassador analytics
                          </p>
                          <p>
                            4. Optimize your approach based on conversion data
                          </p>
                          <p>
                            5. Scale successful strategies to increase earnings
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Success Tips */}
          <Card className="border">
            <CardHeader>
              <CardTitle>Ambassador Success Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="content-strategy">
                  <AccordionTrigger>
                    Content & Marketing Strategy
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Effective Content Types
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Educational Content:</strong> Tutorials,
                          guides, and how-to videos
                        </li>
                        <li>
                          <strong>Case Studies:</strong> Share your own success
                          stories and results
                        </li>
                        <li>
                          <strong>Live Demonstrations:</strong> Show Valmira in
                          action during streams
                        </li>
                        <li>
                          <strong>Community Engagement:</strong> Answer
                          questions and provide support
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Best Platforms for Promotion
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Twitter:</strong> Crypto community is very
                          active, great for quick tips
                        </li>
                        <li>
                          <strong>YouTube:</strong> Perfect for detailed
                          tutorials and demonstrations
                        </li>
                        <li>
                          <strong>Telegram/Discord:</strong> Direct community
                          engagement and support
                        </li>
                        <li>
                          <strong>Medium/Blogs:</strong> In-depth guides and
                          thought leadership
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="audience-targeting">
                  <AccordionTrigger>
                    Target Audience & Positioning
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Ideal Target Audiences
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>New Token Creators:</strong> People launching
                          their first crypto projects
                        </li>
                        <li>
                          <strong>DeFi Enthusiasts:</strong> Users interested in
                          automated trading tools
                        </li>
                        <li>
                          <strong>Crypto Entrepreneurs:</strong> Business-minded
                          individuals in crypto space
                        </li>
                        <li>
                          <strong>Trading Communities:</strong> Groups focused
                          on crypto trading and profits
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Value Propositions to Highlight
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>No Technical Skills Required:</strong> Anyone
                          can use Valmira successfully
                        </li>
                        <li>
                          <strong>Proven Results:</strong> Share real metrics
                          and success stories
                        </li>
                        <li>
                          <strong>Cost Effective:</strong> Much cheaper than
                          hiring developers or agencies
                        </li>
                        <li>
                          <strong>Time Saving:</strong> Automates complex tasks
                          that would take hours manually
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="performance-optimization">
                  <AccordionTrigger>
                    Performance Tracking & Optimization
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Key Metrics to Monitor
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Click-Through Rate:</strong> How many people
                          click your referral links
                        </li>
                        <li>
                          <strong>Conversion Rate:</strong> Percentage of clicks
                          that become active users
                        </li>
                        <li>
                          <strong>User Lifetime Value:</strong> Average revenue
                          generated per referred user
                        </li>
                        <li>
                          <strong>Commission Growth:</strong> Month-over-month
                          earnings increase
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Optimization Strategies
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>A/B Test Content:</strong> Try different
                          approaches and measure results
                        </li>
                        <li>
                          <strong>Focus on Quality:</strong> Better to have
                          fewer high-value referrals
                        </li>
                        <li>
                          <strong>Provide Support:</strong> Help your referrals
                          succeed to increase their usage
                        </li>
                        <li>
                          <strong>Stay Updated:</strong> Keep up with new
                          Valmira features to promote
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Quick Start CTA */}
          <Card className="border bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Ready to Start Earning as an Ambassador?
                </h3>
                <p className="text-muted-foreground">
                  Join the program today and start building your recurring
                  revenue stream
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/ambassador">Apply Now</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/tutorials/ambassador/referral-system">
                      Learn Referral System
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
