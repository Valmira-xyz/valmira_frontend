'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Bot, Play } from 'lucide-react';
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

export default function BotStrategiesVideos() {
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
              <Bot className="h-4 w-4 mr-2" />
              Video Tutorials
            </Badge>
            <h1 className="text-4xl font-bold font-tt tracking-tight">
              Bot Strategies
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how to create and configure different bot trading strategies
            </p>
          </div>

          {/* Videos Grid */}
          <div className="grid gap-8 md:grid-cols-1 max-w-2xl mx-auto">
            {/* Making Downward Trending Bot */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Making Downward Trending Bot
                </CardTitle>
                <CardDescription>
                  Create and configure a bot for downward trending markets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleDriveVideoPlayer
                  driveLink="https://drive.google.com/file/d/1PjV1IJUBDK_7hSx2KpqTH9Pp440PzSs9/view?usp=sharing"
                  title="Making Downward Trending Bot"
                  description="Complete guide to creating downward trending strategies"
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
