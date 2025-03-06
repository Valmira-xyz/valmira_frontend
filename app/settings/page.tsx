"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { HelpCircle, FileQuestion, MessageCircle } from "lucide-react"
import { useWallet } from "@/components/wallet/wallet-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { WalletConnectionButton } from "@/components/wallet/wallet-connection-button"
import { PageHeader } from "@/components/layout/page-header"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { isConnected, walletAddress, onDisconnect } = useWallet()
  const [nickname, setNickname] = useState("")
  const [inAppNotifications, setInAppNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)

  const handleDisconnect = () => {
    onDisconnect()
    // Additional cleanup if needed
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader title="Settings" />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
            <CardDescription>Manage your account and wallet connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Connected Wallet</Label>
                    <p className="text-sm text-muted-foreground">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleDisconnect}>
                    Disconnect Wallet
                  </Button>
                </div>
                <div>
                  <Label htmlFor="nickname">Nickname (optional)</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter a nickname"
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">No wallet connected</p>
                <WalletConnectionButton />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Customize your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme-toggle">Theme</Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
              </div>
              <Switch
                id="theme-toggle"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
            <Separator />
            <div className="space-y-4">
              <Label>Notification Settings</Label>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="in-app-notifications">In-app Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications within the app</p>
                </div>
                <Switch
                  id="in-app-notifications"
                  checked={inAppNotifications}
                  onCheckedChange={setInAppNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Additional security features like two-factor authentication and API key management will be available in
              future updates.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support & Help</CardTitle>
            <CardDescription>Get help and learn more about using our platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <FileQuestion className="mr-2 h-4 w-4" />
              Tutorials & FAQ
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <HelpCircle className="mr-2 h-4 w-4" />
              Help Center
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

