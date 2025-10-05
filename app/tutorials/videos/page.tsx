'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Clock,
  Package,
  Play,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

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
import { GoogleDriveVideoPlayer } from '@/components/ui/video-embed';

export default function AllVideoTutorials() {
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

        <div className="max-w-7xl mx-auto space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="mb-4">
              <Play className="h-4 w-4 mr-2" />
              Complete Video Library
            </Badge>
            <h1 className="text-4xl font-bold font-tt tracking-tight">
              Video Tutorials Hub
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Master Valmira with our comprehensive video library. Watch
              step-by-step guides for everything from basic setup to advanced
              trading strategies.
            </p>
          </div>

          {/* Overview Section */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                How to Use These Videos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Our video tutorials are designed to take you from beginner to
                expert. Each video includes:
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm">
                    Clear step-by-step instructions
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Play className="h-5 w-5 text-primary" />
                  <span className="text-sm">Real-time demonstrations</span>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-sm">Best practices and tips</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Videos organized by categories */}
          <Tabs defaultValue="pack-creation" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pack-creation">Pack Creation</TabsTrigger>
              <TabsTrigger value="wallet-management">Wallets</TabsTrigger>
              <TabsTrigger value="bot-strategies">Bot Strategies</TabsTrigger>
              <TabsTrigger value="referral-widget">
                Referral & Widget
              </TabsTrigger>
            </TabsList>

            {/* Pack Creation Videos */}
            <TabsContent value="pack-creation" className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Package className="h-6 w-6" />
                  Pack Creation & Launch
                </h2>
                <p className="text-muted-foreground">
                  Learn how to create, configure, and launch strategy packs for
                  automated trading
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Creating Launch Day Pack
                    </CardTitle>
                    <CardDescription>
                      Complete guide to creating a comprehensive launch day
                      strategy pack with multiple coordinated bots.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GoogleDriveVideoPlayer
                      driveLink="https://drive.google.com/file/d/1F0O7a-9hp_8YLDVJLGJwrrGEHcLBuWcS/view?usp=sharing"
                      title="Creating Launch Day Pack"
                      showInfo={false}
                    />
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>What you'll learn:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Setting up launch day parameters</li>
                        <li>Coordinating multiple bot strategies</li>
                        <li>Risk management for launch events</li>
                        <li>Monitoring and adjusting during launch</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Pack Creation - Add Liquidity
                    </CardTitle>
                    <CardDescription>
                      Learn how to properly add liquidity as part of your pack
                      creation process for optimal trading conditions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GoogleDriveVideoPlayer
                      driveLink="https://drive.google.com/file/d/1r47caYlvlEj8bLo5JNmsPhk41U990W89/view?usp=sharing"
                      title="Pack Creation - Add Liquidity"
                      showInfo={false}
                    />
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>What you'll learn:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Optimal liquidity provision strategies</li>
                        <li>Timing liquidity addition with pack deployment</li>
                        <li>Managing liquidity pool parameters</li>
                        <li>Avoiding common liquidity mistakes</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Pack Creation - Run All Bots
                    </CardTitle>
                    <CardDescription>
                      Master the coordination of multiple bots within a single
                      pack for maximum trading effectiveness.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GoogleDriveVideoPlayer
                      driveLink="https://drive.google.com/file/d/1iQxty4OWXui46roYdKMcMfMw66sopqrt/view?usp=sharing"
                      title="Pack Creation - Run All Bots"
                      showInfo={false}
                    />
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>What you'll learn:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Bot sequencing and coordination</li>
                        <li>Resource allocation between bots</li>
                        <li>Monitoring multi-bot performance</li>
                        <li>Troubleshooting bot conflicts</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Running Pack
                    </CardTitle>
                    <CardDescription>
                      Monitor, manage, and optimize a live strategy pack for
                      consistent performance and profitability.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GoogleDriveVideoPlayer
                      driveLink="https://drive.google.com/file/d/1SsYd5DlD2zypl4888lw3DOBSfNIY8w3T/view?usp=sharing"
                      title="Running Pack"
                      showInfo={false}
                    />
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>What you'll learn:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Real-time pack monitoring</li>
                        <li>Performance optimization techniques</li>
                        <li>When and how to stop a pack</li>
                        <li>Analyzing pack results and metrics</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Wallet Management Videos */}
            <TabsContent value="wallet-management" className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Wallet className="h-6 w-6" />
                  Wallet Management
                </h2>
                <p className="text-muted-foreground">
                  Master wallet operations, deposits, and security across the
                  Valmira platform
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Using Wallet Management Modal
                    </CardTitle>
                    <CardDescription>
                      Complete guide to the primary wallet management interface
                      for connecting and switching wallets.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GoogleDriveVideoPlayer
                      driveLink="https://drive.google.com/file/d/1zyn79xUKbjhkbiBsf_7F1sW9Dg43JiMq/view?usp=sharing"
                      title="Using Wallet Management Modal"
                      showInfo={false}
                    />
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>What you'll learn:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Connecting your first wallet</li>
                        <li>Switching between multiple wallets</li>
                        <li>Understanding wallet permissions</li>
                        <li>Basic security best practices</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Advanced Wallet Management
                    </CardTitle>
                    <CardDescription>
                      Advanced features and power-user techniques for wallet
                      management across complex trading scenarios.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GoogleDriveVideoPlayer
                      driveLink="https://drive.google.com/file/d/1kjcI5Z0auXGu-hE3hP3EQ8vuIzFHIoll/view?usp=sharing"
                      title="Advanced Wallet Management"
                      showInfo={false}
                    />
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>What you'll learn:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Managing multiple wallet strategies</li>
                        <li>Advanced security configurations</li>
                        <li>Wallet-specific trading setups</li>
                        <li>Troubleshooting connection issues</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Fill Tokens to Deposit Wallet
                    </CardTitle>
                    <CardDescription>
                      Essential guide to depositing tokens into your trading
                      wallet for pack operations and bot funding.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-w-2xl mx-auto">
                      <GoogleDriveVideoPlayer
                        driveLink="https://drive.google.com/file/d/1GqhUtkcf9VzW2FC-LsZG947gsF3ntPF8/view?usp=sharing"
                        title="Fill Tokens to Deposit Wallet"
                        showInfo={false}
                      />
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>What you'll learn:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Understanding deposit requirements</li>
                        <li>Calculating optimal deposit amounts</li>
                        <li>Managing gas fees during deposits</li>
                        <li>Monitoring wallet balances</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Bot Strategies Videos */}
            <TabsContent value="bot-strategies" className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Bot className="h-6 w-6" />
                  Bot Strategies
                </h2>
                <p className="text-muted-foreground">
                  Learn advanced bot configurations and trading strategies for
                  different market conditions
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <Card className="border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Making Downward Trending Bot
                    </CardTitle>
                    <CardDescription>
                      Create and configure specialized bots designed to profit
                      from downward trending markets and bearish conditions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GoogleDriveVideoPlayer
                      driveLink="https://drive.google.com/file/d/1PjV1IJUBDK_7hSx2KpqTH9Pp440PzSs9/view?usp=sharing"
                      title="Making Downward Trending Bot"
                      showInfo={false}
                    />
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>What you'll learn:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Identifying downward trending market conditions</li>
                        <li>Configuring bots for bearish strategies</li>
                        <li>Risk management in declining markets</li>
                        <li>Timing entry and exit points</li>
                        <li>Monitoring bot performance in downtrends</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Referral & Widget Videos */}
            <TabsContent value="referral-widget" className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Users className="h-6 w-6" />
                  Referral & Widget Flow
                </h2>
                <p className="text-muted-foreground">
                  Master the referral system and widget integration to maximize
                  earnings and expand your reach
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Referral Flow
                    </CardTitle>
                    <CardDescription>
                      Complete guide to the Valmira referral system, from setup
                      to earning maximum commissions from your network.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GoogleDriveVideoPlayer
                      driveLink="https://drive.google.com/file/d/1xYLIJAJ3o9gM6-v6kS4wDRZQxrlrng2l/view?usp=sharing"
                      title="Referral Flow Tutorial"
                      showInfo={false}
                    />
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>What you'll learn:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Setting up your referral account</li>
                        <li>Generating and sharing referral links</li>
                        <li>Tracking referral performance</li>
                        <li>Maximizing commission earnings</li>
                        <li>Building a referral network</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Widget Flow
                    </CardTitle>
                    <CardDescription>
                      Learn how to integrate and customize the TokenBoost widget
                      for seamless user experiences and referral tracking.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GoogleDriveVideoPlayer
                      driveLink="https://drive.google.com/file/d/1rNKDHgznzGFnrkzT3AeC2eHgVufEEhKF/view?usp=sharing"
                      title="Widget Flow Tutorial"
                      showInfo={false}
                    />
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>What you'll learn:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Widget integration basics</li>
                        <li>Customizing widget appearance</li>
                        <li>Setting up referral tracking</li>
                        <li>Testing widget functionality</li>
                        <li>Troubleshooting common issues</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
}
