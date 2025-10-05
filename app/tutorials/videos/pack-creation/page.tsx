'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Package, Play } from 'lucide-react';
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
import { GoogleDriveVideoPlayer } from '@/components/ui/video-embed';

export default function PackCreationVideos() {
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

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="mb-4">
              <Package className="h-4 w-4 mr-2" />
              Video Tutorials
            </Badge>
            <h1 className="text-4xl font-bold font-tt tracking-tight">
              Pack Creation & Launch
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete video guides for creating, configuring, and launching
              strategy packs
            </p>
          </div>

          {/* Videos Grid */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Creating Launch Day Pack */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Creating Launch Day Pack
                </CardTitle>
                <CardDescription>
                  Learn how to create a comprehensive launch day strategy pack
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleDriveVideoPlayer
                  driveLink="https://drive.google.com/file/d/1F0O7a-9hp_8YLDVJLGJwrrGEHcLBuWcS/view?usp=sharing"
                  title="Creating Launch Day Pack"
                  description="Step-by-step guide to creating a launch day pack"
                  showInfo={true}
                />
              </CardContent>
            </Card>

            {/* Pack Creation Add Liquidity */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Pack Creation - Add Liquidity
                </CardTitle>
                <CardDescription>
                  How to add liquidity during pack creation process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleDriveVideoPlayer
                  driveLink="https://drive.google.com/file/d/1r47caYlvlEj8bLo5JNmsPhk41U990W89/view?usp=sharing"
                  title="Pack Creation - Add Liquidity"
                  description="Adding liquidity as part of pack creation"
                  showInfo={true}
                />
              </CardContent>
            </Card>

            {/* Pack Creation Run All Bots */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Pack Creation - Run All Bots
                </CardTitle>
                <CardDescription>
                  How to configure and run all bots in your pack
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleDriveVideoPlayer
                  driveLink="https://drive.google.com/file/d/1iQxty4OWXui46roYdKMcMfMw66sopqrt/view?usp=sharing"
                  title="Pack Creation - Run All Bots"
                  description="Configure and launch all bots in your strategy pack"
                  showInfo={true}
                />
              </CardContent>
            </Card>

            {/* Running Pack */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Running Pack
                </CardTitle>
                <CardDescription>
                  Monitor and manage a running strategy pack
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleDriveVideoPlayer
                  driveLink="https://drive.google.com/file/d/1SsYd5DlD2zypl4888lw3DOBSfNIY8w3T/view?usp=sharing"
                  title="Running Pack"
                  description="How to monitor and manage a running pack"
                  showInfo={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
