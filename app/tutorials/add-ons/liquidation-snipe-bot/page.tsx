"use client"

import { Bell } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export default function LiquidationSnipeBotTutorialPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="relative z-20" />
          <h1 className="text-3xl font-bold">Liquidation Snipe Bot Tutorial</h1>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg">
          Want to add liquidity and snipe your own token in the same transaction? Our Liquidation Snipe Bot has you
          covered.
        </p>

        <div className="my-6 space-y-4">
          <p className="flex items-center text-xl">
            <span className="mr-2">🚀</span> Automatically add liquidity and snipe with multiple wallets in one bundle
            transaction
          </p>
          <p className="flex items-center text-xl">
            <span className="mr-2">💰</span> Supports BSC, Ethereum, and Polygon networks
          </p>
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">How It Works…</h2>
        <p className="flex items-center text-lg">
          <span className="mr-2">💡</span> Our bot combines multiple operations in a single transaction bundle:
        </p>
        <ul className="list-none space-y-3 my-4 pl-8">
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>Step 1: Configure your deposit wallet with BNB and tokens</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>Step 2: Set up wallet count and snipe percentage in the "Simulate & Execute" dialog</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>Step 3: Review BNB distribution across wallets and confirm simulation</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>Step 4: Execute the snipe operation when you're ready</span>
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Simulation & Execution Features:</h2>
        <ul className="list-none space-y-3 my-4">
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Generate multiple wallets for distributed sniping
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Customize BNB allocation between liquidity and sniping
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Simulate transaction before execution to verify parameters
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Real-time balance verification to ensure sufficient funds
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Auto Sell Bot Migration</h2>
        <p className="text-lg">
          After a successful snipe, you can migrate to the Auto Sell Bot for automated exit strategies:
        </p>

        <ul className="list-none space-y-3 my-4 pl-8">
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>When your snipe succeeds, the "Migrate to Auto Sell Bot" button appears</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>Click to transfer all sniped tokens to the Auto Sell Bot management</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>Configure individual sell prices for each wallet in the Auto Sell interface</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>The bot automatically sells tokens when your target prices are reached</span>
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Auto Sell Bot Features:</h2>
        <ul className="list-none space-y-3 my-4">
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Real-time token price monitoring
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Individual sell price configuration per wallet
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Automatic transaction execution when targets are met
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> BNB balance verification for gas fees
          </li>
        </ul>

        <div className="bg-primary/10 border-l-4 border-primary p-4 mt-8 rounded-r-lg">
          <p className="text-xl font-bold flex items-center">
            <span className="mr-2">🚀</span> Maximize your launch with our Liquidation Snipe Bot and Auto Sell Bot
            combo! 🚀
          </p>
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">Bot Card UI Elements:</h2>
        <ul className="list-none space-y-3 my-4 pl-8">
          <li className="flex items-start">
            <span className="mr-2 text-primary">📊</span>
            <span>
              <strong>Status Badge:</strong> Shows the current state of your bot (Ready to Snipe, Snipe Succeeded, Snipe
              Failed, Auto Sell Active)
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">💼</span>
            <span>
              <strong>Deposit Wallet:</strong> Address where you'll send BNB and tokens for the operation
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">💰</span>
            <span>
              <strong>Balance Display:</strong> Shows your current BNB and token balances
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔄</span>
            <span>
              <strong>Action Buttons:</strong> "Simulate & Execute", "Migrate to Auto Sell Bot", "Manage Auto Sell", or
              "Reset Bot" depending on the current state
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}

