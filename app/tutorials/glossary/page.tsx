'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Filter, HelpCircle, Search } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GlossaryTutorial() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const glossaryTerms = [
    // Market Making Terms
    {
      term: 'Market Making',
      category: 'market-making',
      definition:
        'The practice of creating consistent buying and selling activity for a token to improve liquidity and trading metrics.',
      example:
        "Using Valmira's Volume Bot to generate trading activity for your token.",
      importance: 'Essential for token credibility and exchange listings.',
    },
    {
      term: 'Volume Generation',
      category: 'market-making',
      definition:
        "Creating trading activity (buys and sells) to increase a token's trading volume statistics.",
      example:
        'A Volume Bot making multiple small trades to boost 24-hour volume from $1,000 to $10,000.',
      importance:
        'Higher volume improves rankings on tracking sites like DexTools.',
    },
    {
      term: 'Liquidity',
      category: 'market-making',
      definition:
        'The availability of tokens for trading. Higher liquidity means easier buying and selling with less price impact.',
      example: 'Adding $10,000 worth of tokens and BNB to a PancakeSwap pool.',
      importance: 'Essential for smooth trading and bot operations.',
    },
    {
      term: 'Slippage',
      category: 'market-making',
      definition:
        'The difference between expected and actual trade prices, usually due to low liquidity or high volatility.',
      example:
        'Expecting to buy at $1.00 but actually paying $1.05 due to low liquidity.',
      importance:
        'High slippage can make bot operations expensive and inefficient.',
    },

    // DeFi Concepts
    {
      term: 'DEX (Decentralized Exchange)',
      category: 'defi',
      definition:
        'A cryptocurrency exchange that operates without a central authority, using smart contracts for trading.',
      example:
        'PancakeSwap (BSC) and Uniswap (Ethereum) where Valmira bots operate.',
      importance: 'Where all bot trading activities take place.',
    },
    {
      term: 'AMM (Automated Market Maker)',
      category: 'defi',
      definition:
        'A system that automatically provides liquidity for trading using mathematical formulas instead of order books.',
      example:
        'PancakeSwap V2 uses an AMM model where bots can trade against liquidity pools.',
      importance: 'Understanding AMMs helps optimize bot trading strategies.',
    },
    {
      term: 'Liquidity Pool',
      category: 'defi',
      definition:
        'A collection of tokens locked in a smart contract to provide liquidity for trading.',
      example:
        'A BNB/YourToken pool on PancakeSwap containing equal values of both tokens.',
      importance:
        'Bots need sufficient liquidity pools to operate effectively.',
    },
    {
      term: 'LP Tokens',
      category: 'defi',
      definition:
        'Liquidity Provider tokens received when adding liquidity to a pool, representing your share of the pool.',
      example:
        'Receiving CAKE-LP tokens when adding liquidity to a PancakeSwap pool.',
      importance: 'Needed to remove liquidity later; keep them safe.',
    },

    // Bot-Specific Terms
    {
      term: 'Volume Bot',
      category: 'bots',
      definition:
        'Automated system that creates trading activity by buying and selling tokens to increase volume metrics.',
      example:
        "Bot making 100 small trades per hour to boost your token's daily volume.",
      importance:
        'First bot most projects activate for immediate market presence.',
    },
    {
      term: 'Holder Bot',
      category: 'bots',
      definition:
        'Bot that creates multiple wallets and distributes tokens among them to increase holder count.',
      example:
        'Creating 500 unique wallets, each holding different amounts of your token.',
      importance:
        'Higher holder counts improve token metrics and investor confidence.',
    },
    {
      term: 'Distribution Bot',
      category: 'bots',
      definition:
        'Automated system for sending tokens to multiple wallets efficiently in batches.',
      example:
        'Sending 1000 tokens each to 100 community members in one transaction.',
      importance: 'Essential for airdrops and community token distribution.',
    },
    {
      term: 'Auto Sell Bot',
      category: 'bots',
      definition:
        'Bot that automatically sells tokens when they reach target prices or hit stop-loss levels.',
      example:
        'Automatically selling when token price increases 50% or decreases 20%.',
      importance: 'Protects profits and prevents major losses.',
    },
    {
      term: 'Bundle Snipe Bot',
      category: 'bots',
      definition:
        'Advanced bot that monitors transaction bundles and captures arbitrage opportunities.',
      example:
        'Detecting price discrepancies in transaction bundles and executing profitable trades.',
      importance:
        'Advanced tool for experienced users to generate additional profits.',
    },
    {
      term: 'Sniping',
      category: 'bots',
      definition:
        'Quickly buying tokens at launch or when opportunities arise, often using automated bots.',
      example:
        'Buying tokens immediately when liquidity is added to capture early prices.',
      importance:
        'Can be protective (for your project) or profitable (trading opportunities).',
    },

    // Blockchain Basics
    {
      term: 'Gas Fees',
      category: 'blockchain',
      definition:
        'Transaction fees paid to process operations on the blockchain network.',
      example: 'Paying 0.001 BNB to execute a bot transaction on BSC.',
      importance:
        'Major cost factor in bot operations; BSC has much lower fees than Ethereum.',
    },
    {
      term: 'Smart Contract',
      category: 'blockchain',
      definition:
        'Self-executing code on the blockchain that automatically performs actions when conditions are met.',
      example:
        'Your token contract that defines how your token behaves and can be traded.',
      importance: 'All bot operations interact with smart contracts.',
    },
    {
      term: 'Wallet Address',
      category: 'blockchain',
      definition:
        'A unique identifier for a blockchain wallet, like a bank account number but public.',
      example: '0x742d35Cc6634C0532925a3b8D4C0b3f4e8b4c8d2',
      importance: 'Used to send/receive tokens and identify unique holders.',
    },
    {
      term: 'Private Key',
      category: 'blockchain',
      definition:
        'Secret code that gives complete control over a wallet. Never share this.',
      example: 'A long string of characters that unlocks your wallet.',
      importance: 'Anyone with your private key can steal all your funds.',
    },
    {
      term: 'Seed Phrase',
      category: 'blockchain',
      definition:
        '12-24 words that can recover your entire wallet. Never share these.',
      example: 'apple banana cherry dog elephant... (12 random words)',
      importance: 'Your backup to recover wallet if device is lost.',
    },

    // Trading Terms
    {
      term: 'Market Cap',
      category: 'trading',
      definition:
        'Total value of all tokens in circulation (token price × total supply).',
      example: 'Token price $0.10 × 1,000,000 supply = $100,000 market cap.',
      importance: 'Key metric for comparing token sizes and tracking growth.',
    },
    {
      term: 'Price Impact',
      category: 'trading',
      definition:
        'How much a trade affects the token price, usually higher with larger trades or lower liquidity.',
      example: 'A $1000 buy order increasing token price by 2%.',
      importance: 'Large price impacts can make bot operations less efficient.',
    },
    {
      term: 'Arbitrage',
      category: 'trading',
      definition:
        'Profiting from price differences of the same asset across different markets or time periods.',
      example:
        'Buying a token on one DEX for $1.00 and selling on another for $1.05.',
      importance: 'Bundle Snipe Bot uses arbitrage opportunities for profit.',
    },
    {
      term: 'Bull Market',
      category: 'trading',
      definition: 'Period of rising prices and positive market sentiment.',
      example:
        'When most cryptocurrencies are increasing in value over weeks/months.',
      importance:
        'Different bot strategies work better in bull vs bear markets.',
    },
    {
      term: 'Bear Market',
      category: 'trading',
      definition: 'Period of falling prices and negative market sentiment.',
      example:
        'When most cryptocurrencies are decreasing in value over weeks/months.',
      importance:
        'Requires more conservative bot settings and risk management.',
    },
  ];

  const categories = [
    { id: 'all', name: 'All Terms', count: glossaryTerms.length },
    {
      id: 'market-making',
      name: 'Market Making',
      count: glossaryTerms.filter((t) => t.category === 'market-making').length,
    },
    {
      id: 'defi',
      name: 'DeFi Concepts',
      count: glossaryTerms.filter((t) => t.category === 'defi').length,
    },
    {
      id: 'bots',
      name: 'Bot Terms',
      count: glossaryTerms.filter((t) => t.category === 'bots').length,
    },
    {
      id: 'blockchain',
      name: 'Blockchain Basics',
      count: glossaryTerms.filter((t) => t.category === 'blockchain').length,
    },
    {
      id: 'trading',
      name: 'Trading Terms',
      count: glossaryTerms.filter((t) => t.category === 'trading').length,
    },
  ];

  const filteredTerms = glossaryTerms.filter((term) => {
    const matchesSearch =
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
              Crypto Trading Glossary
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Valmira Terminology Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete glossary of crypto, DeFi, and bot-related terms to help
              you understand and navigate the Valmira platform
            </p>
          </div>

          {/* Introduction */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                How to Use This Glossary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This glossary explains all the important terms you'll encounter
                while using Valmira. Each term includes a simple definition,
                real-world example, and explanation of why it matters for your
                success. Use the search and filter features to quickly find
                specific terms.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">Each Term Includes:</p>
                <ul className="space-y-1 text-sm">
                  <li>
                    <strong>Definition:</strong> Clear, simple explanation in
                    everyday language
                  </li>
                  <li>
                    <strong>Example:</strong> Real-world scenario showing how it
                    applies
                  </li>
                  <li>
                    <strong>Importance:</strong> Why this term matters for your
                    Valmira success
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search terms or definitions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name} ({category.count})
                  </Button>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                Showing {filteredTerms.length} of {glossaryTerms.length} terms
              </p>
            </CardContent>
          </Card>

          {/* Glossary Terms */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Glossary Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredTerms.map((term, index) => (
                  <AccordionItem key={index} value={`term-${index}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{term.term}</span>
                        <Badge variant="outline" className="text-xs">
                          {categories.find((c) => c.id === term.category)?.name}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Definition</h4>
                        <p className="text-muted-foreground">
                          {term.definition}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Example</h4>
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm">{term.example}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Why It Matters</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {term.importance}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {filteredTerms.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No terms found matching your search.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Reference by Category */}
          <Card className="border">
            <CardHeader>
              <CardTitle>Quick Reference by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="essential" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="essential">Essential Terms</TabsTrigger>
                  <TabsTrigger value="beginner">Beginner Basics</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Concepts</TabsTrigger>
                </TabsList>

                <TabsContent value="essential" className="space-y-4">
                  <h4 className="font-semibold">
                    Must-Know Terms for Valmira Success
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <ul className="space-y-2">
                        <li>
                          <strong>Market Making:</strong> Core concept behind
                          all Valmira bots
                        </li>
                        <li>
                          <strong>Volume Generation:</strong> Primary goal of
                          Volume Bot
                        </li>
                        <li>
                          <strong>Gas Fees:</strong> Major cost factor in
                          operations
                        </li>
                        <li>
                          <strong>Liquidity:</strong> Essential for bot
                          functionality
                        </li>
                      </ul>
                    </div>
                    <div>
                      <ul className="space-y-2">
                        <li>
                          <strong>DEX:</strong> Where all bot trading happens
                        </li>
                        <li>
                          <strong>Wallet Address:</strong> How bots identify
                          unique holders
                        </li>
                        <li>
                          <strong>Smart Contract:</strong> What bots interact
                          with
                        </li>
                        <li>
                          <strong>Slippage:</strong> Affects bot efficiency
                        </li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="beginner" className="space-y-4">
                  <h4 className="font-semibold">
                    Start Here if You're New to Crypto
                  </h4>
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong>Blockchain Basics:</strong> Wallet Address,
                      Private Key, Seed Phrase, Gas Fees
                    </p>
                    <p>
                      <strong>Trading Basics:</strong> Market Cap, Price Impact,
                      Bull/Bear Market
                    </p>
                    <p>
                      <strong>DeFi Basics:</strong> DEX, Liquidity Pool, LP
                      Tokens
                    </p>
                    <p>
                      <strong>Valmira Basics:</strong> Volume Bot, Holder Bot,
                      Market Making
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <h4 className="font-semibold">
                    Advanced Concepts for Experienced Users
                  </h4>
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong>Advanced Bots:</strong> Bundle Snipe Bot, Auto
                      Sell Bot, Distribution Bot
                    </p>
                    <p>
                      <strong>Trading Concepts:</strong> Arbitrage, AMM, Sniping
                    </p>
                    <p>
                      <strong>Optimization:</strong> Price Impact, Slippage
                      management
                    </p>
                    <p>
                      <strong>Risk Management:</strong> Stop-loss, position
                      sizing, market timing
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick Start CTA */}
          <Card className="border bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Ready to Apply Your Knowledge?
                </h3>
                <p className="text-muted-foreground">
                  Now that you understand the terminology, start putting it into
                  practice
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/tutorials/projects">
                      Create Your First Project
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/tutorials/best-practices">
                      Learn Best Practices
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
