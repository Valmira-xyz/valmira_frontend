'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  HelpCircle,
  LayoutDashboard,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define section type for better type safety
interface DashboardSection {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
  id: string;
}

export default function DashboardOverviewTutorial() {
  const [activeSection, setActiveSection] = useState(0);

  const dashboardSections: DashboardSection[] = [
    {
      id: 'main-navigation',
      title: 'Main Navigation',
      description: 'Sidebar navigation and main menu items',
      icon: LayoutDashboard,
      items: [
        'Projects',
        'Portfolio',
        'Strategy Packs',
        'Ambassador',
        'Tutorials',
        'Settings',
      ],
    },
    {
      id: 'project-dashboard',
      title: 'Project Dashboard',
      description: 'Individual project management and bot controls',
      icon: Settings,
      items: ['Project Header', 'Bot Add-ons', 'Analytics', 'Danger Zone'],
    },
    {
      id: 'analytics-metrics',
      title: 'Analytics & Metrics',
      description: 'Performance tracking and data visualization',
      icon: BarChart3,
      items: [
        'Trading Volume',
        'Bot Performance',
        'Holder Metrics',
        'Cost Analysis',
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
              Dashboard Overview Tutorial
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Valmira Dashboard Navigation Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Master the Valmira dashboard to efficiently manage your projects,
              monitor performance, and navigate all platform features
            </p>
          </div>

          {/* What & Why Section */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Understanding the Valmira Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Dashboard Overview
                </h3>
                <p className="text-muted-foreground mb-4">
                  The Valmira dashboard is your command center for managing all
                  aspects of your token projects. It's designed to give you
                  quick access to essential functions while providing detailed
                  insights into your bot performance and project metrics. Think
                  of it as the cockpit of an airplane - everything you need is
                  organized and easily accessible.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">The Dashboard Provides:</p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Project Management:</strong> Create, configure,
                      and monitor all your token projects
                    </li>
                    <li>
                      <strong>Bot Control Center:</strong> Activate, configure,
                      and monitor all trading bots
                    </li>
                    <li>
                      <strong>Real-time Analytics:</strong> Live performance
                      metrics and trading data
                    </li>
                    <li>
                      <strong>Quick Actions:</strong> Fast access to common
                      tasks and settings
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Why Dashboard Navigation Matters
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Efficiency</p>
                        <p className="text-sm text-muted-foreground">
                          Quick access to all features saves time
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Better Decisions</p>
                        <p className="text-sm text-muted-foreground">
                          Clear data visualization helps you make informed
                          choices
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Reduced Errors</p>
                        <p className="text-sm text-muted-foreground">
                          Organized interface reduces configuration mistakes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Professional Management</p>
                        <p className="text-sm text-muted-foreground">
                          Comprehensive overview of all operations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Navigation */}
          <div className="sticky top-4 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-sm">
            <div className="flex flex-wrap gap-2 justify-center">
              {dashboardSections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(index);
                    document
                      .getElementById(section.id)
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Main Navigation */}
          <Card
            id="main-navigation"
            className="border"
            ref={(el) => {
              if (activeSection === 0 && el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Main Navigation & Sidebar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="navigation" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="navigation">Main Menu</TabsTrigger>
                  <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
                  <TabsTrigger value="user-menu">User Menu</TabsTrigger>
                </TabsList>

                <TabsContent value="navigation" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold">Core Sections</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Projects</Badge>
                            <span>Manage all your token projects</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Portfolio</Badge>
                            <span>Overview of all project performance</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Strategy Packs</Badge>
                            <span>Pre-configured bot combinations</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-semibold">Additional Features</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Ambassador</Badge>
                            <span>Referral program and earnings</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Tutorials</Badge>
                            <span>Learning resources and guides</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Settings</Badge>
                            <span>Account and platform preferences</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="quick-actions" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Common Quick Actions</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p>
                          <strong>Create Project:</strong> Start new token
                          project from anywhere
                        </p>
                        <p>
                          <strong>Connect Wallet:</strong> Quick wallet
                          connection in header
                        </p>
                        <p>
                          <strong>Network Switch:</strong> Change between BSC
                          and ETH networks
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p>
                          <strong>Notifications:</strong> Real-time alerts for
                          bot activities
                        </p>
                        <p>
                          <strong>Help Center:</strong> Quick access to support
                          and documentation
                        </p>
                        <p>
                          <strong>Theme Toggle:</strong> Switch between light
                          and dark modes
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="user-menu" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold">User Menu Options</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p>
                          <strong>Wallet Information:</strong> View connected
                          wallet address and balance
                        </p>
                        <p>
                          <strong>Account Settings:</strong> Manage profile and
                          preferences
                        </p>
                        <p>
                          <strong>Disconnect Wallet:</strong> Safely disconnect
                          from the platform
                        </p>
                        <p>
                          <strong>Support:</strong> Access help and contact
                          options
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Analytics & Metrics */}
          <Card
            id="analytics-metrics"
            className="border"
            ref={(el) => {
              if (activeSection === 2 && el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics & Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="trading-metrics">
                  <AccordionTrigger>Trading & Volume Metrics</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">Volume Metrics</h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>24h Volume:</strong> Total trading volume in
                            last 24 hours
                          </li>
                          <li>
                            <strong>Total Volume:</strong> Cumulative volume
                            since project start
                          </li>
                          <li>
                            <strong>Bot-Generated Volume:</strong> Volume
                            created by your bots
                          </li>
                          <li>
                            <strong>Organic Volume:</strong> Natural trading
                            from other users
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Transaction Metrics
                        </h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Transaction Count:</strong> Total number of
                            trades
                          </li>
                          <li>
                            <strong>Buy/Sell Ratio:</strong> Proportion of buys
                            vs sells
                          </li>
                          <li>
                            <strong>Average Transaction Size:</strong> Mean
                            trade amount
                          </li>
                          <li>
                            <strong>Unique Traders:</strong> Number of different
                            wallets trading
                          </li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bot-metrics">
                  <AccordionTrigger>
                    Bot Performance Indicators
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">
                          Status Indicators
                        </h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Active:</strong> Bot is running and
                            executing operations
                          </li>
                          <li>
                            <strong>Paused:</strong> Bot is temporarily stopped
                          </li>
                          <li>
                            <strong>Inactive:</strong> Bot is configured but not
                            running
                          </li>
                          <li>
                            <strong>Error:</strong> Bot encountered issues and
                            needs attention
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Performance Metrics
                        </h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Success Rate:</strong> Percentage of
                            successful operations
                          </li>
                          <li>
                            <strong>Cost Efficiency:</strong> Results achieved
                            per unit spent
                          </li>
                          <li>
                            <strong>Execution Speed:</strong> Time from trigger
                            to completion
                          </li>
                          <li>
                            <strong>ROI:</strong> Return on investment for bot
                            operations
                          </li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="financial-metrics">
                  <AccordionTrigger>Financial & Cost Tracking</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">Cost Breakdown</h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Gas Fees:</strong> Network transaction costs
                          </li>
                          <li>
                            <strong>Bot Operations:</strong> Costs for bot
                            activities
                          </li>
                          <li>
                            <strong>Platform Fees:</strong> Valmira service
                            charges
                          </li>
                          <li>
                            <strong>Total Spent:</strong> Cumulative costs
                            across all activities
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Revenue Tracking</h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Trading Profits:</strong> Gains from bot
                            trading activities
                          </li>
                          <li>
                            <strong>Token Appreciation:</strong> Value increase
                            of held tokens
                          </li>
                          <li>
                            <strong>Net Profit/Loss:</strong> Total gains minus
                            all costs
                          </li>
                          <li>
                            <strong>ROI Percentage:</strong> Return on
                            investment ratio
                          </li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Project Dashboard */}
          <Card
            id="project-dashboard"
            className="border"
            ref={(el) => {
              if (activeSection === 1 && el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Project Dashboard Layout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {dashboardSections.map((section, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-colors ${
                      activeSection === index
                        ? 'bg-primary/5 border-primary'
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activeSection === index
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <section.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{section.title}</h3>
                        <p className="text-muted-foreground mb-3">
                          {section.description}
                        </p>

                        {index === 0 && (
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Projects Section:</strong> Central hub for
                              all your token projects
                            </p>
                            <p>- View all projects in card or list format</p>
                            <p>
                              - Quick project creation with "Create Project"
                              button
                            </p>
                            <p>
                              - Search and filter projects by name, network, or
                              status
                            </p>
                            <p>
                              - Project cards show key metrics: volume, holders,
                              active bots
                            </p>
                          </div>
                        )}

                        {index === 1 && (
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Individual Project View:</strong> Detailed
                              management interface
                            </p>
                            <p>
                              - <strong>Project Header:</strong> Token info,
                              contract address, network details
                            </p>
                            <p>
                              - <strong>Add-ons Section:</strong> All available
                              bots with status indicators
                            </p>
                            <p>
                              - <strong>Quick Actions:</strong> Manual LP, swap,
                              deposit functions
                            </p>
                            <p>
                              - <strong>Analytics Panel:</strong> Real-time
                              performance metrics
                            </p>
                            <p>
                              - <strong>Danger Zone:</strong> Project deletion
                              and critical settings
                            </p>
                          </div>
                        )}

                        {index === 2 && (
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Analytics Dashboard:</strong>{' '}
                              Comprehensive performance tracking
                            </p>
                            <p>
                              - <strong>Trading Metrics:</strong> Volume,
                              transactions, profit/loss
                            </p>
                            <p>
                              - <strong>Bot Performance:</strong> Individual bot
                              statistics and efficiency
                            </p>
                            <p>
                              - <strong>Holder Analytics:</strong> Holder count
                              growth and distribution
                            </p>
                            <p>
                              - <strong>Cost Analysis:</strong> Gas fees, bot
                              costs, ROI calculations
                            </p>
                            <p>
                              - <strong>Time-based Charts:</strong> Historical
                              performance trends
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics & Understanding Data */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Understanding Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="trading-metrics">
                  <AccordionTrigger>Trading & Volume Metrics</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">Volume Metrics</h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>24h Volume:</strong> Total trading volume in
                            last 24 hours
                          </li>
                          <li>
                            <strong>Total Volume:</strong> Cumulative volume
                            since project start
                          </li>
                          <li>
                            <strong>Bot-Generated Volume:</strong> Volume
                            created by your bots
                          </li>
                          <li>
                            <strong>Organic Volume:</strong> Natural trading
                            from other users
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Transaction Metrics
                        </h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Transaction Count:</strong> Total number of
                            trades
                          </li>
                          <li>
                            <strong>Buy/Sell Ratio:</strong> Proportion of buys
                            vs sells
                          </li>
                          <li>
                            <strong>Average Transaction Size:</strong> Mean
                            trade amount
                          </li>
                          <li>
                            <strong>Unique Traders:</strong> Number of different
                            wallets trading
                          </li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bot-metrics">
                  <AccordionTrigger>
                    Bot Performance Indicators
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">
                          Status Indicators
                        </h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Active:</strong> Bot is running and
                            executing operations
                          </li>
                          <li>
                            <strong>Paused:</strong> Bot is temporarily stopped
                          </li>
                          <li>
                            <strong>Inactive:</strong> Bot is configured but not
                            running
                          </li>
                          <li>
                            <strong>Error:</strong> Bot encountered issues and
                            needs attention
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Performance Metrics
                        </h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Success Rate:</strong> Percentage of
                            successful operations
                          </li>
                          <li>
                            <strong>Cost Efficiency:</strong> Results achieved
                            per unit spent
                          </li>
                          <li>
                            <strong>Execution Speed:</strong> Time from trigger
                            to completion
                          </li>
                          <li>
                            <strong>ROI:</strong> Return on investment for bot
                            operations
                          </li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="financial-metrics">
                  <AccordionTrigger>Financial & Cost Tracking</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">Cost Breakdown</h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Gas Fees:</strong> Network transaction costs
                          </li>
                          <li>
                            <strong>Bot Operations:</strong> Costs for bot
                            activities
                          </li>
                          <li>
                            <strong>Platform Fees:</strong> Valmira service
                            charges
                          </li>
                          <li>
                            <strong>Total Spent:</strong> Cumulative costs
                            across all activities
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Revenue Tracking</h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Trading Profits:</strong> Gains from bot
                            trading activities
                          </li>
                          <li>
                            <strong>Token Appreciation:</strong> Value increase
                            of held tokens
                          </li>
                          <li>
                            <strong>Net Profit/Loss:</strong> Total gains minus
                            all costs
                          </li>
                          <li>
                            <strong>ROI Percentage:</strong> Return on
                            investment ratio
                          </li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Navigation Tips */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Pro Navigation Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Efficiency Tips</h4>
                  <ul className="space-y-2 text-sm">
                    <li>- Use keyboard shortcuts for common actions</li>
                    <li>- Bookmark frequently used project pages</li>
                    <li>- Set up browser notifications for bot alerts</li>
                    <li>- Use the search function to quickly find projects</li>
                    <li>- Customize dashboard layout for your workflow</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">
                    Monitoring Best Practices
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>- Check dashboard daily for bot status updates</li>
                    <li>- Set up alerts for critical events</li>
                    <li>- Review weekly performance reports</li>
                    <li>- Monitor cost vs performance ratios</li>
                    <li>- Keep track of network gas prices</li>
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
                  Ready to Explore Your Dashboard?
                </h3>
                <p className="text-muted-foreground">
                  Start by creating your first project and familiarizing
                  yourself with the interface
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/projects">Go to Dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/tutorials/projects">Create First Project</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const prevSection = Math.max(0, activeSection - 1);
            setActiveSection(prevSection);
            document
              .getElementById(dashboardSections[prevSection].id)
              ?.scrollIntoView({ behavior: 'smooth' });
          }}
          disabled={activeSection === 0}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const nextSection = Math.min(
              dashboardSections.length - 1,
              activeSection + 1
            );
            setActiveSection(nextSection);
            document
              .getElementById(dashboardSections[nextSection].id)
              ?.scrollIntoView({ behavior: 'smooth' });
          }}
          disabled={activeSection === dashboardSections.length - 1}
        >
          Next
        </Button>
      </div>
    </motion.div>
  );
}
