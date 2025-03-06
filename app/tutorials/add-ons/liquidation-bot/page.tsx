import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LiquidationBotTutorial() {
  return (
    <div className="container mx-auto py-10">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/projects">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">How the Liquidation & Snipe Bot Works</h1>
      <div className="space-y-6">
        <p>
          The Liquidation & Snipe Bot is your ultimate tool for protecting your position and capturing early
          opportunities. Here's how it works:
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">🚀 Liquidation Protection</h2>
        <ul className="list-none space-y-2">
          <li>🔍 Continuously monitors your position</li>
          <li>⚠️ Detects potential liquidation risks</li>
          <li>🛡️ Automatically adjusts your position to avoid liquidation</li>
          <li>💼 Optimizes collateral usage for maximum efficiency</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">🎯 Sniping Functionality</h2>
        <ul className="list-none space-y-2">
          <li>👀 Watches for new token launches or opportunities</li>
          <li>⚡ Executes rapid purchases when conditions are met</li>
          <li>👥 Utilizes multiple wallets for diversified sniping</li>
          <li>📊 Distributes tokens across wallets for risk management</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">🔄 Simulation & Execution</h2>
        <ul className="list-none space-y-2">
          <li>🧪 Simulates sniping scenarios before execution</li>
          <li>🔢 Allows customization of wallet count and snipe percentage</li>
          <li>💡 Provides detailed breakdown of BNB allocation</li>
          <li>✅ Executes snipe only when balance is sufficient</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">🔀 Migration to Auto Sell Bot</h2>
        <ul className="list-none space-y-2">
          <li>🏁 After successful sniping, option to migrate to Auto Sell Bot appears</li>
          <li>🤖 Auto Sell Bot takes over management of sniped tokens</li>
          <li>📈 Implements intelligent selling strategies to maximize profits</li>
          <li>🔒 Provides automated exit strategy for sniped positions</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">💡 How to Use</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Configure your Liquidation & Snipe Bot parameters</li>
          <li>Click "Simulate & Execute" to run a simulation</li>
          <li>Review the simulation results and adjust if necessary</li>
          <li>Execute the snipe when you're satisfied with the simulation</li>
          <li>After successful sniping, click "Migrate to Auto Sell Bot"</li>
          <li>Auto Sell Bot takes over to manage and sell your sniped tokens</li>
        </ol>

        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mt-6" role="alert">
          <p className="font-bold">Remember:</p>
          <p>
            Always monitor your positions and adjust bot parameters as market conditions change. The Liquidation & Snipe
            Bot is a powerful tool, but it should be used responsibly and in conjunction with your own research and risk
            management strategies.
          </p>
        </div>
      </div>
    </div>
  )
}

