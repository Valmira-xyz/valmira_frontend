"use client"

import { Bell } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export default function VolumeBotTutorialPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="relative z-20" />
          <h1 className="text-3xl font-bold">Volume Bot Tutorial</h1>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg">Trying to get your token trending or just need some volume on the cheap? We got you.</p>

        <div className="my-6 space-y-4">
          <p className="flex items-center text-xl">
            <span className="mr-2">🚀</span> You can fire our bot up with just 1SOL!
          </p>
          <p className="flex items-center text-xl">
            <span className="mr-2">💰</span> Pancakeswap V2 tokens only.
          </p>
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">How It Works…</h2>
        <p className="flex items-center text-lg">
          <span className="mr-2">💡</span> Our bot splits your deposit into two separate bots for a more organic boost:
        </p>
        <ul className="list-none space-y-3 my-4 pl-8">
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>Bot 1: Micro buys with multiple wallets, sells bundle with one wallet.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">🔹</span>
            <span>Bot 2: Bigger buys, with different wallets, sells bundle with one wallet.</span>
          </li>
        </ul>
        <p className="flex items-center text-lg">
          <span className="mr-2">🔥</span> You can choose the bot speed and max buy amount.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Whales Hybrid Bot Benefits:</h2>
        <ul className="list-none space-y-3 my-4">
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Boost Transactions
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Boost Volume
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Boost Makers
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-green-500">✅</span> Makes More Buys Than Sells
          </li>
        </ul>

        <div className="bg-primary/10 border-l-4 border-primary p-4 mt-8 rounded-r-lg">
          <p className="text-xl font-bold flex items-center">
            <span className="mr-2">🚀</span> Fire it up today & make an impact on your stats! 🚀
          </p>
        </div>
      </div>
    </div>
  )
}

