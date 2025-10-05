'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  HelpCircle,
  Lock,
  Shield,
  Target,
  TrendingUp,
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

export default function BestPracticesTutorial() {
  // const [activeCategory, setActiveCategory] = useState(0);

  // const practiceCategories = [
  //   {
  //     title: 'Security Fundamentals',
  //     description: 'Essential security practices to protect your funds and data',
  //     icon: Shield,
  //     color: 'text-red-600',
  //   },
  //   {
  //     title: 'Cost Optimization',
  //     description: 'Strategies to minimize costs and maximize efficiency',
  //     icon: DollarSign,
  //     color: 'text-green-600',
  //   },
  //   {
  //     title: 'Performance Optimization',
  //     description: 'Best practices for bot performance and results',
  //     icon: TrendingUp,
  //     color: 'text-blue-600',
  //   },
  //   {
  //     title: 'Risk Management',
  //     description: 'Managing risks and protecting your investments',
  //     icon: Target,
  //     color: 'text-orange-600',
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
              Best Practices Tutorial
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Valmira Best Practices Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Master security, optimization, and risk management to maximize
              your success on the Valmira platform
            </p>
          </div>

          {/* Introduction */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Why Best Practices Matter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-muted-foreground mb-4">
                  Following best practices on Valmira isn't just about avoiding
                  problems - it's about maximizing your success. Think of these
                  practices as the difference between a professional trader and
                  a beginner. They help you protect your investments, reduce
                  costs, optimize performance, and achieve better results with
                  less risk.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">Best Practices Help You:</p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Protect Your Assets:</strong> Prevent loss from
                      security breaches or mistakes
                    </li>
                    <li>
                      <strong>Reduce Costs:</strong> Minimize gas fees and
                      optimize bot spending
                    </li>
                    <li>
                      <strong>Improve Results:</strong> Get better performance
                      from your bots and strategies
                    </li>
                    <li>
                      <strong>Manage Risk:</strong> Make informed decisions and
                      avoid common pitfalls
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Fundamentals */}
          <Card className="border border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <Shield className="h-5 w-5" />
                Security Fundamentals - Critical Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="wallet-security" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="wallet-security">
                    Wallet Security
                  </TabsTrigger>
                  <TabsTrigger value="platform-security">
                    Platform Safety
                  </TabsTrigger>
                  <TabsTrigger value="emergency-procedures">
                    Emergency Procedures
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="wallet-security" className="space-y-4">
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertTitle>Critical Security Rules</AlertTitle>
                    <AlertDescription>
                      These rules are non-negotiable. Breaking them can result
                      in total loss of funds.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3 text-red-600">
                        Never Share These (Will Cause Fund Loss):
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Seed Phrase (12-24 words):</strong> Anyone
                          with this can steal all your funds
                        </li>
                        <li>
                          <strong>Private Keys:</strong> Direct access to your
                          wallet
                        </li>
                        <li>
                          <strong>Wallet Password:</strong> Protects your local
                          wallet access
                        </li>
                        <li>
                          <strong>Backup Files:</strong> Encrypted wallet files
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-green-600">
                        Safe to Share:
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Wallet Address:</strong> Public identifier
                          (like bank account number)
                        </li>
                        <li>
                          <strong>Transaction Hashes:</strong> Public blockchain
                          records
                        </li>
                        <li>
                          <strong>Token Contract Addresses:</strong> Public
                          smart contract addresses
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">
                        Wallet Security Checklist:
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          - Write seed phrase on paper, never store digitally
                        </li>
                        <li>
                          - Use strong, unique passwords for wallet applications
                        </li>
                        <li>
                          - Enable all available security features (2FA,
                          biometrics)
                        </li>
                        <li>
                          - Keep wallet software updated to latest versions
                        </li>
                        <li>- Use hardware wallets for large amounts</li>
                        <li>
                          - Test recovery process with small amounts first
                        </li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="platform-security" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">
                        Valmira Platform Safety:
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Verify URLs:</strong> Always check you're on
                          the real Valmira website
                        </li>
                        <li>
                          <strong>Bookmark Official Site:</strong> Use bookmarks
                          to avoid phishing sites
                        </li>
                        <li>
                          <strong>Check SSL Certificate:</strong> Look for the
                          lock icon in browser
                        </li>
                        <li>
                          <strong>Start Small:</strong> Test with minimal
                          amounts before large operations
                        </li>
                        <li>
                          <strong>Review Transactions:</strong> Always check
                          transaction details before signing
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">
                        Bot Configuration Safety:
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          - Set reasonable limits on bot spending and operations
                        </li>
                        <li>- Use stop-loss mechanisms where available</li>
                        <li>- Monitor bot activities regularly</li>
                        <li>
                          - Keep emergency funds separate from bot operations
                        </li>
                        <li>- Document your configurations for recovery</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">
                        Red Flags to Watch For:
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>- Unexpected transaction requests</li>
                        <li>- Requests for seed phrases or private keys</li>
                        <li>- Suspicious email or social media messages</li>
                        <li>- Unusual bot behavior or unexpected costs</li>
                        <li>
                          - Pressure to act quickly on "limited time" offers
                        </li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="emergency-procedures" className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Emergency Response Plan</AlertTitle>
                    <AlertDescription>
                      Know what to do if something goes wrong. Quick action can
                      save your funds.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">
                        If You Suspect Compromise:
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          1. <strong>Immediately:</strong> Pause all active bots
                        </li>
                        <li>
                          2. <strong>Secure Funds:</strong> Transfer funds to a
                          new, secure wallet
                        </li>
                        <li>
                          3. <strong>Disconnect:</strong> Disconnect wallet from
                          all DApps
                        </li>
                        <li>
                          4. <strong>Document:</strong> Screenshot all
                          suspicious activity
                        </li>
                        <li>
                          5. <strong>Report:</strong> Contact Valmira support
                          immediately
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">
                        If Bots Malfunction:
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          1. <strong>Stop Operations:</strong> Pause affected
                          bots immediately
                        </li>
                        <li>
                          2. <strong>Check Balances:</strong> Verify all wallet
                          balances
                        </li>
                        <li>
                          3. <strong>Review Logs:</strong> Check recent
                          transaction history
                        </li>
                        <li>
                          4. <strong>Withdraw Funds:</strong> Remove funds from
                          bot wallets if needed
                        </li>
                        <li>
                          5. <strong>Contact Support:</strong> Report issues
                          with detailed information
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">
                        Recovery Preparation:
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          - Keep multiple copies of seed phrases in secure
                          locations
                        </li>
                        <li>
                          - Document all wallet addresses and bot configurations
                        </li>
                        <li>
                          - Maintain emergency contact list (support, exchanges)
                        </li>
                        <li>- Practice wallet recovery procedures</li>
                        <li>- Keep some funds in separate, secure wallets</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Cost Optimization */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Optimization Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="network-optimization">
                  <AccordionTrigger>
                    Network and Gas Fee Optimization
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">
                          Network Selection Strategy
                        </h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>BSC for Beginners:</strong> 90% lower fees
                            than Ethereum
                          </li>
                          <li>
                            <strong>ETH for Scale:</strong> Use when project
                            value justifies higher costs
                          </li>
                          <li>
                            <strong>Test on BSC First:</strong> Learn and
                            optimize before moving to ETH
                          </li>
                          <li>
                            <strong>Monitor Gas Prices:</strong> Use gas
                            trackers to time transactions
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Gas Fee Management
                        </h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Batch Operations:</strong> Combine multiple
                            actions when possible
                          </li>
                          <li>
                            <strong>Off-Peak Timing:</strong> Execute during low
                            network usage
                          </li>
                          <li>
                            <strong>Gas Price Tools:</strong> Use ETH Gas
                            Station, BSC Gas Tracker
                          </li>
                          <li>
                            <strong>Emergency Reserves:</strong> Keep extra gas
                            for urgent transactions
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Cost-Effective Practices
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li>
                          - Start bots during low gas periods (weekends, late
                          nights UTC)
                        </li>
                        <li>
                          - Use longer intervals between bot operations to
                          reduce transaction frequency
                        </li>
                        <li>
                          - Batch multiple bot configurations before activation
                        </li>
                        <li>
                          - Monitor network congestion before starting expensive
                          operations
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bot-optimization">
                  <AccordionTrigger>Bot Cost Optimization</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">
                          Volume Bot Optimization
                        </h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Start Small:</strong> Begin with 0.1 BNB to
                            test effectiveness
                          </li>
                          <li>
                            <strong>Optimize Intervals:</strong> 5-10 second
                            intervals balance cost/activity
                          </li>
                          <li>
                            <strong>Monitor ROI:</strong> Track volume generated
                            vs cost spent
                          </li>
                          <li>
                            <strong>Scale Gradually:</strong> Increase funding
                            based on results
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Holder Bot Efficiency
                        </h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Batch Creation:</strong> Create 50-100
                            holders per session
                          </li>
                          <li>
                            <strong>Time Distribution:</strong> Spread creation
                            over hours to reduce gas spikes
                          </li>
                          <li>
                            <strong>Target Optimization:</strong> Set realistic
                            holder count goals
                          </li>
                          <li>
                            <strong>Cost Per Holder:</strong> Track and optimize
                            cost efficiency
                          </li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="budget-management">
                  <AccordionTrigger>
                    Budget Management & Planning
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Budget Allocation Strategy
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>
                            <strong>Recommended Budget Split:</strong>
                          </p>
                          <ul className="space-y-1 ml-4">
                            <li>- 40% Volume Bot (immediate activity)</li>
                            <li>- 30% Holder Bot (community building)</li>
                            <li>- 20% Distribution/Auto Sell (management)</li>
                            <li>
                              - 10% Emergency reserve (gas, unexpected costs)
                            </li>
                          </ul>
                        </div>
                        <div>
                          <p>
                            <strong>Cost Tracking:</strong>
                          </p>
                          <ul className="space-y-1 ml-4">
                            <li>- Daily cost monitoring and limits</li>
                            <li>- Weekly performance vs cost reviews</li>
                            <li>- ROI calculations for each bot</li>
                            <li>- Adjust budgets based on performance</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Performance Optimization */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="bot-performance">
                  <AccordionTrigger>
                    Bot Performance Optimization
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Volume Bot Performance
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Optimal Settings:</strong> 0.001-0.005 native
                          currency per transaction
                        </li>
                        <li>
                          <strong>Timing Strategy:</strong> 5-second intervals
                          for balanced activity
                        </li>
                        <li>
                          <strong>Performance Metrics:</strong> Track
                          volume/cost ratio and transaction success rate
                        </li>
                        <li>
                          <strong>Market Timing:</strong> Increase activity
                          during high-interest periods
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Holder Bot Effectiveness
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Target Strategy:</strong> Start with 50-100
                          holders, scale to 500+
                        </li>
                        <li>
                          <strong>Distribution Pattern:</strong> Use
                          natural/random distribution for organic appearance
                        </li>
                        <li>
                          <strong>Time Delays:</strong> Spread holder creation
                          over 24-48 hours
                        </li>
                        <li>
                          <strong>Quality Metrics:</strong> Monitor holder
                          retention and activity patterns
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="strategy-optimization">
                  <AccordionTrigger>
                    Strategy & Timing Optimization
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">Launch Strategy</h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Pre-Launch:</strong> Set up bots but don't
                            activate
                          </li>
                          <li>
                            <strong>Launch Day:</strong> Activate Volume Bot
                            first for immediate activity
                          </li>
                          <li>
                            <strong>Week 1:</strong> Add Holder Bot for
                            community building
                          </li>
                          <li>
                            <strong>Ongoing:</strong> Add Distribution and Auto
                            Sell as needed
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Market Timing</h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>High Activity:</strong> Weekdays, US/EU
                            business hours
                          </li>
                          <li>
                            <strong>Low Gas:</strong> Weekends, late nights UTC
                          </li>
                          <li>
                            <strong>Market Events:</strong> Increase activity
                            during crypto news
                          </li>
                          <li>
                            <strong>Seasonal Patterns:</strong> Adjust for
                            market cycles
                          </li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="monitoring-optimization">
                  <AccordionTrigger>
                    Monitoring & Adjustment Strategies
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Performance Monitoring Schedule
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Daily:</strong> Check bot status, review
                          overnight activity, monitor costs
                        </li>
                        <li>
                          <strong>Weekly:</strong> Analyze performance trends,
                          adjust parameters, review ROI
                        </li>
                        <li>
                          <strong>Monthly:</strong> Comprehensive review,
                          strategy adjustments, budget reallocation
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Key Performance Indicators
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>
                            <strong>Volume Metrics:</strong>
                          </p>
                          <ul className="space-y-1 ml-4">
                            <li>- Volume generated per dollar spent</li>
                            <li>- Transaction success rate</li>
                            <li>- Cost per transaction</li>
                            <li>- Ranking improvements on tracking sites</li>
                          </ul>
                        </div>
                        <div>
                          <p>
                            <strong>Growth Metrics:</strong>
                          </p>
                          <ul className="space-y-1 ml-4">
                            <li>- Holder count growth rate</li>
                            <li>- Organic vs bot-generated activity ratio</li>
                            <li>- Community engagement levels</li>
                            <li>- Overall project value growth</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Risk Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="financial-risk">
                  <AccordionTrigger>Financial Risk Management</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Investment Risk Rules
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Never Invest More Than You Can Lose:</strong>{' '}
                          Only use funds you can afford to lose completely
                        </li>
                        <li>
                          <strong>Start Small:</strong> Begin with minimum
                          amounts to learn and test
                        </li>
                        <li>
                          <strong>Diversify:</strong> Don't put all funds into
                          one bot or strategy
                        </li>
                        <li>
                          <strong>Set Limits:</strong> Define maximum
                          daily/weekly spending limits
                        </li>
                        <li>
                          <strong>Emergency Fund:</strong> Keep separate funds
                          for emergencies and opportunities
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Bot Risk Management
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Gradual Scaling:</strong> Increase bot funding
                          gradually based on performance
                        </li>
                        <li>
                          <strong>Stop-Loss Mechanisms:</strong> Use Auto Sell
                          Bot to protect profits
                        </li>
                        <li>
                          <strong>Regular Monitoring:</strong> Check bot
                          performance daily
                        </li>
                        <li>
                          <strong>Backup Plans:</strong> Have procedures for
                          pausing/stopping bots quickly
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="technical-risk">
                  <AccordionTrigger>Technical Risk Mitigation</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">Platform Risks</h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Network Congestion:</strong> Monitor gas
                            prices, have backup timing
                          </li>
                          <li>
                            <strong>Smart Contract Risk:</strong> Understand
                            that all DeFi has inherent risks
                          </li>
                          <li>
                            <strong>Bot Malfunctions:</strong> Regular
                            monitoring and quick response procedures
                          </li>
                          <li>
                            <strong>Market Volatility:</strong> Adjust
                            strategies based on market conditions
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Operational Risks
                        </h4>
                        <ul className="space-y-1">
                          <li>
                            <strong>Human Error:</strong> Double-check all
                            configurations
                          </li>
                          <li>
                            <strong>Timing Issues:</strong> Don't rush important
                            decisions
                          </li>
                          <li>
                            <strong>Communication:</strong> Keep clear records
                            of all actions
                          </li>
                          <li>
                            <strong>Updates:</strong> Stay informed about
                            platform changes
                          </li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="market-risk">
                  <AccordionTrigger>Market Risk Awareness</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Market Condition Strategies
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Bull Market:</strong> More aggressive bot
                          settings, higher volume generation
                        </li>
                        <li>
                          <strong>Bear Market:</strong> Conservative approach,
                          focus on cost efficiency
                        </li>
                        <li>
                          <strong>Volatile Markets:</strong> Shorter bot cycles,
                          more frequent monitoring
                        </li>
                        <li>
                          <strong>Stable Markets:</strong> Consistent long-term
                          strategies
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        External Risk Factors
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Regulatory Changes:</strong> Stay informed
                          about crypto regulations
                        </li>
                        <li>
                          <strong>Market Sentiment:</strong> Adjust strategies
                          based on overall crypto sentiment
                        </li>
                        <li>
                          <strong>Competition:</strong> Monitor similar projects
                          and adapt accordingly
                        </li>
                        <li>
                          <strong>Technology Changes:</strong> Keep up with
                          blockchain and DeFi developments
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <Card className="border bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Reference Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Daily Checklist</h4>
                  <ul className="space-y-1 text-sm">
                    <li>- Check all bot statuses</li>
                    <li>- Review overnight activity and costs</li>
                    <li>- Monitor wallet balances</li>
                    <li>- Check for any error notifications</li>
                    <li>- Review market conditions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Weekly Review</h4>
                  <ul className="space-y-1 text-sm">
                    <li>- Analyze bot performance vs costs</li>
                    <li>- Review and adjust bot parameters</li>
                    <li>- Check project rankings and metrics</li>
                    <li>- Plan budget for upcoming week</li>
                    <li>- Update security practices</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start CTA */}
          <Card className="border bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Ready to Implement Best Practices?
                </h3>
                <p className="text-muted-foreground">
                  Start with security fundamentals, then gradually implement
                  optimization strategies
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/tutorials/wallet-setup">
                      Secure Your Wallet
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/projects">Apply to Projects</Link>
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
