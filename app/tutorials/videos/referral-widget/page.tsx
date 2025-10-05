'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Play, Users } from 'lucide-react';
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

export default function ReferralWidgetVideos() {
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
              <Users className="h-4 w-4 mr-2" />
              Video Tutorials
            </Badge>
            <h1 className="text-4xl font-bold font-tt tracking-tight">
              Referral & Widget Flow
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Master the referral system and widget integration with
              step-by-step videos
            </p>
          </div>

          {/* Videos Grid */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Referral Flow */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Referral Flow
                </CardTitle>
                <CardDescription>
                  Complete guide to the referral system and earning commissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleDriveVideoPlayer
                  driveLink="https://drive.google.com/file/d/1xYLIJAJ3o9gM6-v6kS4wDRZQxrlrng2l/view?usp=sharing"
                  title="Referral Flow Tutorial"
                  description="Learn how to use the referral system to maximize earnings"
                  showInfo={true}
                />
              </CardContent>
            </Card>

            {/* Widget Flow */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Widget Flow
                </CardTitle>
                <CardDescription>
                  How to integrate and use the TokenBoost widget
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleDriveVideoPlayer
                  driveLink="https://drive.google.com/file/d/1rNKDHgznzGFnrkzT3AeC2eHgVufEEhKF/view?usp=sharing"
                  title="Widget Flow Tutorial"
                  description="Complete widget integration and usage guide"
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
