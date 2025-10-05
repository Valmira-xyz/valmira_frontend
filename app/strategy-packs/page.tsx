'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';

import { CreateStrategyPackModal } from '@/components/strategy-packs/pack-create-modal';
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

// Strategy pack data
const strategyPacks = [
  {
    id: 'liquidity-builder-1',
    title: 'Liquidity Builder',
    description:
      'Establish and maintain healthy liquidity pools for your token',
    status: 'Active',
    bots: ['Holder Bot', 'Volume Bot'],
    configurableParams: 3,
    estimatedCost: '$5-10/day',
  },
  {
    id: 'liquidity-builder-2',
    title: 'Liquidity Builder',
    description:
      'Establish and maintain healthy liquidity pools for your token',
    status: 'Active',
    bots: ['Volume Bot', 'Liquidity Bot', 'Price Stabilizer'],
    configurableParams: 3,
    estimatedCost: '$5-10/day',
  },
  {
    id: 'liquidity-builder-3',
    title: 'Liquidity Builder',
    description:
      'Establish and maintain healthy liquidity pools for your token',
    status: 'Active',
    bots: ['Volume Bot', 'Trend Bot', 'Snipe Bot'],
    configurableParams: 3,
    estimatedCost: '$5-10/day',
  },
  {
    id: 'liquidity-builder-4',
    title: 'Liquidity Builder',
    description:
      'Establish and maintain healthy liquidity pools for your token',
    status: 'Active',
    bots: ['Holder Bot', 'Volume Bot'],
    configurableParams: 3,
    estimatedCost: '$5-10/day',
  },
  {
    id: 'liquidity-builder-5',
    title: 'Liquidity Builder',
    description:
      'Establish and maintain healthy liquidity pools for your token',
    status: 'Active',
    bots: ['Volume Bot', 'Liquidity Bot', 'Price Stabilizer'],
    configurableParams: 3,
    estimatedCost: '$5-10/day',
  },
  {
    id: 'liquidity-builder-6',
    title: 'Liquidity Builder',
    description:
      'Establish and maintain healthy liquidity pools for your token',
    status: 'Active',
    bots: ['Volume Bot', 'Trend Bot', 'Snipe Bot'],
    configurableParams: 3,
    estimatedCost: '$5-10/day',
  },
  {
    id: 'liquidity-builder-7',
    title: 'Liquidity Builder',
    description:
      'Establish and maintain healthy liquidity pools for your token',
    status: 'Active',
    bots: ['Holder Bot', 'Volume Bot'],
    configurableParams: 3,
    estimatedCost: '$5-10/day',
  },
  {
    id: 'liquidity-builder-8',
    title: 'Liquidity Builder',
    description:
      'Establish and maintain healthy liquidity pools for your token',
    status: 'Active',
    bots: ['Volume Bot', 'Liquidity Bot', 'Price Stabilizer'],
    configurableParams: 3,
    estimatedCost: '$5-10/day',
  },
  {
    id: 'liquidity-builder-9',
    title: 'Liquidity Builder',
    description:
      'Establish and maintain healthy liquidity pools for your token',
    status: 'Active',
    bots: ['Volume Bot', 'Trend Bot', 'Snipe Bot'],
    configurableParams: 3,
    estimatedCost: '$5-10/day',
  },
];

const getBotIcon = (botName: string) => {
  switch (botName) {
    case 'Holder Bot':
      return '👥';
    case 'Volume Bot':
      return '📊';
    case 'Liquidity Bot':
      return '💧';
    case 'Price Stabilizer':
      return '⚡';
    case 'Trend Bot':
      return '📈';
    case 'Snipe Bot':
      return '🎯';
    default:
      return '🤖';
  }
};

export default function StrategyPacksPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredPacks = strategyPacks.filter((pack) => {
    if (selectedTab === 'all') return true;
    console.log(pack);
    // Add more filtering logic based on tabs if needed
    return true;
  });

  return (
    <motion.div
      className="p-4 md:p-6 space-y-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Strategy Packs</h1>
            <p className="text-muted-foreground mt-2">
              Optimized Setups - These setups save you time and ensure
              consistency—get started instantly with best-in-class
              configurations tailored for success.
            </p>
          </div>
        </div>

        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="flex w-full overflow-x-auto gap-2 p-1 scrollbar-hide md:justify-between">
            <TabsTrigger
              value="all"
              className="whitespace-nowrap flex-shrink-0 md:flex-1"
            >
              All Packs
            </TabsTrigger>
            <TabsTrigger
              value="liquidity"
              className="whitespace-nowrap flex-shrink-0 md:flex-1"
            >
              Liquidity
            </TabsTrigger>
            <TabsTrigger
              value="volume"
              className="whitespace-nowrap flex-shrink-0 md:flex-1"
            >
              Volume
            </TabsTrigger>
            <TabsTrigger
              value="growth"
              className="whitespace-nowrap flex-shrink-0 md:flex-1"
            >
              Growth
            </TabsTrigger>
            <TabsTrigger
              value="protection"
              className="whitespace-nowrap flex-shrink-0 md:flex-1"
            >
              Protection
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="whitespace-nowrap flex-shrink-0 md:flex-1"
            >
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPacks.map((pack) => (
                <Card key={pack.id} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{pack.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {pack.description}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        {pack.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Bot Icons */}
                    <div className="flex flex-wrap gap-2">
                      {pack.bots.map((bot, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 text-sm"
                        >
                          <span className="text-lg">{getBotIcon(bot)}</span>
                          <span className="text-muted-foreground">{bot}</span>
                        </div>
                      ))}
                    </div>

                    {/* Configuration Info */}
                    <div className="text-sm text-muted-foreground">
                      {pack.configurableParams} configurable parameters
                    </div>

                    {/* Pricing */}
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Est. cost:
                        </div>
                        <div className="font-semibold">
                          {pack.estimatedCost}
                        </div>
                      </div>
                    </div>

                    {/* Deploy Button */}
                    <Button
                      className="w-full"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Deploy Pack →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreateStrategyPackModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </motion.div>
  );
}
