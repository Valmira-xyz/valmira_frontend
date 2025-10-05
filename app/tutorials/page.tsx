'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  Bot,
  Code,
  HelpCircle,
  Play,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function TutorialsPage() {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-4 md:p-6">
        {/* Getting Started */}
        <Card className="border flex flex-col">
          <CardHeader>
            <CardTitle className="font-tt">Getting Started</CardTitle>
            <CardDescription>
              Learn the basics of Valmira platform
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col flex-1">
            <CardContent className="flex-1">
              <ul className="space-y-2">
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/projects"
                      className="hover:underline w-full text-start"
                    >
                      Creating Your First Project
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/wallet-setup"
                      className="w-full text-start hover:underline"
                    >
                      Wallet Setup Guide
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/dashboard-overview"
                      className="w-full text-start hover:underline"
                    >
                      Dashboard Overview
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/pack-creation"
                      className="w-full text-start hover:underline"
                    >
                      Pack Creation & Configuration
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/best-practices"
                      className="w-full text-start hover:underline"
                    >
                      Best Practices
                    </Link>
                  </Button>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="default" asChild className="w-full">
                <Link href="/tutorials/projects">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View All Basics
                </Link>
              </Button>
            </CardFooter>
          </div>
        </Card>

        {/* Add-Ons & Bots */}
        <Card className="border flex flex-col">
          <CardHeader>
            <CardTitle className="font-tt">Add-Ons & Bots</CardTitle>
            <CardDescription>
              Tutorials for different bot types and add-ons
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col flex-1">
            <CardContent className="flex-1">
              <ul className="space-y-2">
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/add-ons/volume-bot"
                      className="w-full text-start hover:underline"
                    >
                      Volume Bot
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/add-ons/holder-bot"
                      className="w-full text-start hover:underline"
                    >
                      Holder Bot
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/add-ons/auto-sell-bot"
                      className="w-full text-start hover:underline"
                    >
                      Auto Sell Bot
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/add-ons/bundle-snipe"
                      className="w-full text-start hover:underline"
                    >
                      Bundle Snipe Bot
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/add-ons/distribution-bot"
                      className="w-full text-start hover:underline"
                    >
                      Distribution Bot
                    </Link>
                  </Button>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="default" asChild className="w-full">
                <Link href="/tutorials/add-ons/volume-bot">
                  <Bot className="mr-2 h-4 w-4" />
                  View All Add-Ons
                </Link>
              </Button>
            </CardFooter>
          </div>
        </Card>

        {/* Ambassador Program */}
        <Card className="border flex flex-col">
          <CardHeader>
            <CardTitle className="font-tt">Ambassador Program</CardTitle>
            <CardDescription>
              Earn commissions through referrals and partnerships
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col flex-1">
            <CardContent className="flex-1">
              <ul className="space-y-2">
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/ambassador/getting-started"
                      className="w-full text-start hover:underline"
                    >
                      Getting Started
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/ambassador/referral-system"
                      className="w-full text-start hover:underline"
                    >
                      Referral System
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/ambassador/widget-integration"
                      className="w-full text-start hover:underline"
                    >
                      Widget Integration
                    </Link>
                  </Button>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="default" asChild className="w-full">
                <Link href="/tutorials/ambassador/getting-started">
                  <Users className="mr-2 h-4 w-4" />
                  View Ambassador Guides
                </Link>
              </Button>
            </CardFooter>
          </div>
        </Card>

        {/* Video Tutorials */}
        <Card className="border flex flex-col">
          <CardHeader>
            <CardTitle className="font-tt">Video Tutorials</CardTitle>
            <CardDescription>
              Watch step-by-step video guides for all features
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col flex-1">
            <CardContent className="flex-1">
              <ul className="space-y-2">
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/videos/pack-creation"
                      className="w-full text-start hover:underline"
                    >
                      Pack Creation & Launch
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/videos/wallet-management"
                      className="w-full text-start hover:underline"
                    >
                      Wallet Management
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/videos/bot-strategies"
                      className="w-full text-start hover:underline"
                    >
                      Bot Strategies
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/videos/referral-widget"
                      className="w-full text-start hover:underline"
                    >
                      Referral & Widget Flow
                    </Link>
                  </Button>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="default" asChild className="w-full">
                <Link href="/tutorials/videos">
                  <Play className="h-4 w-4" />
                  Video Guides
                </Link>
              </Button>
            </CardFooter>
          </div>
        </Card>

        {/* Widget Integration */}
        <Card className="border flex flex-col">
          <CardHeader>
            <CardTitle className="font-tt">Widget Integration</CardTitle>
            <CardDescription>
              Embed Valmira functionality in your applications
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col flex-1">
            <CardContent className="flex-1">
              <ul className="space-y-2">
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/widgets/tokenboost-integration"
                      className="w-full text-start hover:underline"
                    >
                      TokenBoost Integration
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/widgets/customization"
                      className="w-full text-start hover:underline"
                    >
                      Widget Customization
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/widgets/api-reference"
                      className="w-full text-start hover:underline"
                    >
                      API Reference
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/widgets/troubleshooting"
                      className="w-full text-start hover:underline"
                    >
                      Troubleshooting
                    </Link>
                  </Button>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="default" asChild className="w-full">
                <Link href="/tutorials/widgets/tokenboost-integration">
                  <Code className="mr-2 h-4 w-4" />
                  View Widget Guides
                </Link>
              </Button>
            </CardFooter>
          </div>
        </Card>

        {/* Advanced Technical */}
        <Card className="border flex flex-col">
          <CardHeader>
            <CardTitle className="font-tt">Advanced Technical</CardTitle>
            <CardDescription>
              Advanced bot strategies and performance optimization
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col flex-1">
            <CardContent className="flex-1">
              <ul className="space-y-2">
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/advanced/bot-orchestration"
                      className="w-full text-start hover:underline"
                    >
                      Bot Orchestration
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/advanced/performance-optimization"
                      className="w-full text-start hover:underline"
                    >
                      Performance Optimization
                    </Link>
                  </Button>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="default" asChild className="w-full">
                <Link href="/tutorials/advanced/bot-orchestration">
                  <Zap className="mr-2 h-4 w-4" />
                  View Advanced Guides
                </Link>
              </Button>
            </CardFooter>
          </div>
        </Card>

        {/* Helpful Resources */}
        <Card className="border flex flex-col">
          <CardHeader>
            <CardTitle className="font-tt">Helpful Resources</CardTitle>
            <CardDescription>
              Additional resources and documentation
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col flex-1">
            <CardContent className="flex-1">
              <ul className="space-y-2">
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/faqs"
                      className="w-full text-start hover:underline"
                    >
                      Frequently Asked Questions
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/glossary"
                      className="w-full text-start hover:underline"
                    >
                      Crypto Trading Glossary
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/advanced"
                      className="w-full text-start hover:underline"
                    >
                      Advanced Features
                    </Link>
                  </Button>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="default" asChild className="w-full">
                <Link href="/faqs">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  View Resources
                </Link>
              </Button>
            </CardFooter>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
