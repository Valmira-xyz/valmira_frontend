"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"

export default function HolderBotTutorialPage() {
  return (
    <div className="container mx-auto py-6">   
      <PageHeader title="Holder Bot Tutorial" />      

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg">
          Need to create a diverse holder base for your token? Our Holder Bot creates a natural-looking distribution
          pattern across multiple wallets.
        </p>

        <div className="my-6 space-y-4">
          <p className="flex items-center text-xl">
            <span className="mr-2">👥</span> Simulate hundreds of unique holders with just a few clicks
          </p>
          <p className="flex items-center text-xl">
            <span className="mr-2">💰</span> Start with as little as 0.3 BNB to create your first batch of holders
          </p>
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">How It Works…</h2>
        <p className="flex items-center text-lg">
          <span className="mr-2">💡</span> Our Holder Bot creates a natural distribution pattern across multiple
          wallets:
        </p>
        <ul className="list-none space-y-3 my-4 pl-8">
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>Step 1: Deposit BNB to the provided wallet address</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>Step 2: Configure the number of holders and token distribution pattern</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>Step 3: Execute the bot to generate wallets and distribute tokens</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>Step 4: Monitor the progress in real-time on your dashboard</span>
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Holder Bot Benefits:</h2>
        <ul className="list-none space-y-3 my-4">
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Improve token metrics on DexTools and other platforms
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Create a more attractive holder count for potential
            investors
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Distribute tokens in a natural-looking pattern
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Increase community perception of token adoption
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Advanced Features:</h2>
        <ul className="list-none space-y-3 my-4 pl-8">
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>
              <strong>Time-Delayed Distribution:</strong> Spread holder creation over time for a more natural growth
              pattern
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>
              <strong>Transaction History:</strong> Generate realistic transaction histories for each wallet
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>
              <strong>Wallet Activity:</strong> Simulate natural wallet activity with small buys/sells over time
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>
              <strong>Custom Addresses:</strong> Include your own wallets in the distribution pattern
            </span>
          </li>
        </ul>

        <div className="bg-primary/10 border-l-4 border-primary p-4 mt-8 rounded-r-lg">
          <p className="text-xl font-bold flex items-center">
            <span className="mr-2">🚀</span> Boost your token's metrics with a diverse holder base today! 🚀
          </p>
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">Bot Card UI Elements:</h2>
        <ul className="list-none space-y-3 my-4 pl-8">
          <li className="flex items-start">
            <span className="mr-2 text-primary">📊</span>
            <span>
              <strong>Status Badge:</strong> Shows whether the bot is Active or Inactive
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">💼</span>
            <span>
              <strong>Deposit Wallet:</strong> Address where you'll send BNB to fund the holder creation
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">👥</span>
            <span>
              <strong>Generated Holders:</strong> Real-time count of holders created by the bot
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔄</span>
            <span>
              <strong>Execute Button:</strong> Click to start the holder generation process after depositing BNB
            </span>
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Getting Started:</h2>
        <ol className="list-decimal list-inside space-y-3 my-4">
          <li>Enable the Holder Bot from your project dashboard</li>
          <li>Deposit the required BNB to the provided wallet address</li>
          <li>Configure your desired distribution pattern and holder count</li>
          <li>Click "Execute" to start the holder generation process</li>
          <li>Monitor the progress in real-time on your dashboard</li>
        </ol>

        <p className="text-lg mt-6">
          For optimal results, we recommend using the Holder Bot in combination with our Volume Bot to create both
          holder diversity and trading activity.
        </p>
      </div>
    </div>
  )
}

