'use client';

import { useState } from 'react';

import {
  Bell,
  FileQuestion,
  HelpCircle,
  LogOut,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAccount, useDisconnect } from 'wagmi';

import { PageHeader } from '@/components/layout/page-header';
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
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const handleDisconnect = () => {
    disconnect();
    // Additional cleanup if needed
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-[20px]">Profile Overview</CardTitle>
          <CardDescription>
            Manage your account and wallet connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="flex items-center justify-between">
                <WalletDisplay variant="simple" />

                <Button variant="outline" onClick={handleDisconnect}>
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
          <CardTitle className="text-[20px]">Account Settings</CardTitle>
          <CardDescription>
            Customize your account preferences
          </CardDescription>
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
                <Bell className="h-5 w-5 text-muted-foreground" />
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
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader>
          <CardTitle className="text-[20px]">Security</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Additional security features like two-factor authentication and
            API key management will be available in future updates.
          </p>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader>
          <CardTitle className="text-[20px]">Support & Help</CardTitle>
          <CardDescription>
            Get help and learn more about using our platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start py-6">
            <FileQuestion className="mr-2 h-4 w-4" />
            Tutorials & FAQ
          </Button>
          <Button variant="outline" className="w-full justify-start py-6">
            <MessageCircle className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
          <Button variant="outline" className="w-full justify-start py-6">
            <HelpCircle className="mr-2 h-4 w-4" />
            Help Center
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
