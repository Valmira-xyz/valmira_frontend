'use client';

import { useState } from 'react';
import { LiaDiscord } from 'react-icons/lia';
import { MdOutlineNotificationsActive } from 'react-icons/md';

import { motion } from 'framer-motion';
import { BookOpen, Copy, FileQuestion, LogOut, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAccount, useDisconnect } from 'wagmi';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { WalletConnectionButton } from '@/components/wallet/wallet-connection-button';
import { WalletDisplay } from '@/components/wallet/wallet-display';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const handleDisconnect = () => {
    disconnect();
    // Additional cleanup if needed
  };

  const discordInviteLink = 'https://discord.gg/e7GMPWXwNH'; // Replace with your actual Discord invite link

  const handleDiscordClick = () => {
    window.open(discordInviteLink, '_blank');
  };

  const handleCopyDiscordLink = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening Discord when clicking copy
    try {
      await navigator.clipboard.writeText(discordInviteLink);
      alert('Discord invite link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy Discord link:', err);
      alert('Failed to copy link. Please try again.');
    }
  };

  const handleTutorialsClick = () => {
    router.push('/tutorials');
  };

  const handleFAQClick = () => {
    router.push('/faqs');
  };

  return (
    <motion.div
      className="space-y-6 p-4 md:p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-[20px] !font-tt">
            Profile Overview
          </CardTitle>
          <CardDescription>
            Manage your account and wallet connection
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <WalletDisplay variant="simple" />

                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect Wallet
                </Button>
              </div>
              {/* <div>
                <Label htmlFor="nickname">Nickname (optional)</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter a nickname"
                />
              </div> */}
            </>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2 sm:mb-0">
                No wallet connected
              </p>
              <WalletConnectionButton />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader>
          <CardTitle className="text-[20px] !font-tt">
            Account Settings
          </CardTitle>
          <CardDescription>Customize your account preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme-toggle">Theme</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark mode
              </p>
            </div>
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={(checked) =>
                setTheme(checked ? 'dark' : 'light')
              }
            />
          </div>
          <Separator />
          <div className="space-y-4">
            <Label>Notification Settings</Label>
            <div className="flex items-center justify-between  border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                {/* <Bell className="h-5 w-5 text-muted-foreground" /> */}
                <MdOutlineNotificationsActive className="h-6 w-6 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="in-app-notifications">
                    In-app Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications within the app
                  </p>
                </div>
              </div>
              <Switch
                id="in-app-notifications"
                checked={inAppNotifications}
                onCheckedChange={setInAppNotifications}
              />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-6 w-6 text-muted-foreground" />
                <div className="space-y-0.5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <Label htmlFor="email-notifications">
                      Email Notifications
                    </Label>
                    <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-200 text-yellow-800 font-semibold whitespace-nowrap w-fit">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader className="!pb-2">
          <CardTitle className="text-[20px] !font-tt">Security</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="!pt-2">
          {/* <div className="flex items-center justify-between border rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img
                  src="/code4arenaSVG/code4rena-logomark.svg"
                  alt="Code4rena"
                  className="w-6 h-6"
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label>Code4rena Audit</Label>
                  <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-200 text-yellow-800 font-semibold whitespace-nowrap">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Professional security audit by Code4rena
                </p>
              </div>
            </div>
          </div> */}

          <p className="text-sm text-muted-foreground mt-0">
            Additional security features like two-factor authentication and API
            key management will be available in future updates.
          </p>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader>
          <CardTitle className="text-[20px] !font-tt ">
            Support & Help
          </CardTitle>
          <CardDescription>
            Get help and learn more about using our platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start py-6"
            onClick={handleTutorialsClick}
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Tutorials
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start py-6"
            onClick={handleFAQClick}
          >
            <FileQuestion className="mr-2 h-5 w-5" />
            FAQ
          </Button>
          <div className="flex w-full border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              className="flex-1 justify-start py-6 rounded-none border-0"
              onClick={handleDiscordClick}
            >
              <LiaDiscord className="mr-2 h-5 w-5" />
              Contact Support
            </Button>
            <Button
              variant="ghost"
              className="px-3 py-6 border-l rounded-none border-0"
              onClick={handleCopyDiscordLink}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
