'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Play, Wallet } from 'lucide-react';
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

export default function WalletManagementVideos() {
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
              <Wallet className="h-4 w-4 mr-2" />
              Video Tutorials
            </Badge>
            <h1 className="text-4xl font-bold font-tt tracking-tight">
              Wallet Management
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete guides for managing wallets and deposits across the
              platform
            </p>
          </div>

          {/* Videos Grid */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Using Wallet Management Modal */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Using Wallet Management Modal
                </CardTitle>
                <CardDescription>
                  How to use the wallet management modal interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleDriveVideoPlayer
                  driveLink="https://drive.google.com/file/d/1zyn79xUKbjhkbiBsf_7F1sW9Dg43JiMq/view?usp=sharing"
                  title="Using Wallet Management Modal"
                  description="Complete guide to the wallet management interface"
                  showInfo={true}
                />
              </CardContent>
            </Card>

            {/* Using Wallet Management Modal 02 */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Wallet Management Modal - Advanced
                </CardTitle>
                <CardDescription>
                  Advanced wallet management features and tips
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleDriveVideoPlayer
                  driveLink="https://drive.google.com/file/d/1kjcI5Z0auXGu-hE3hP3EQ8vuIzFHIoll/view?usp=sharing"
                  title="Advanced Wallet Management"
                  description="Advanced features and best practices"
                  showInfo={true}
                />
              </CardContent>
            </Card>

            {/* Fill Tokens to Deposit Wallet */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Fill Tokens to Deposit Wallet
                </CardTitle>
                <CardDescription>
                  How to deposit tokens into your trading wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleDriveVideoPlayer
                  driveLink="https://drive.google.com/file/d/1GqhUtkcf9VzW2FC-LsZG947gsF3ntPF8/view?usp=sharing"
                  title="Fill Tokens to Deposit Wallet"
                  description="Step-by-step guide to depositing tokens"
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
