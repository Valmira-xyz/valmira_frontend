import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "FAQs | Valmira",
  description: "Frequently asked questions about Valmira platform and services",
}

export default function FAQsPage() {
  return (
    <div>
      <PageHeader title="Frequently Asked Questions" />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Questions</CardTitle>
            <CardDescription>Common questions about Valmira platform and services</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is-valmira">
                <AccordionTrigger>What is Valmira?</AccordionTrigger>
                <AccordionContent>
                  Valmira is a comprehensive platform for managing crypto projects and trading bots. Our platform
                  provides tools for creating, monitoring, and optimizing your crypto trading strategies with advanced
                  automation features.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="how-to-start">
                <AccordionTrigger>How do I get started with Valmira?</AccordionTrigger>
                <AccordionContent>
                  To get started, connect your wallet using the button in the sidebar. Once connected, you can create
                  your first project by navigating to the Projects section and clicking on "Create New Project". Follow
                  the guided setup process to configure your trading bot.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="supported-chains">
                <AccordionTrigger>Which blockchain networks are supported?</AccordionTrigger>
                <AccordionContent>
                  Valmira currently supports Ethereum, Binance Smart Chain, Polygon, Arbitrum, and Optimism. We're
                  continuously working to add support for more networks based on user demand.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trading Bots & Projects</CardTitle>
            <CardDescription>Questions about setting up and managing trading bots</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="bot-types">
                <AccordionTrigger>What types of trading bots are available?</AccordionTrigger>
                <AccordionContent>
                  Valmira offers several types of trading bots including Liquidation Snipe Bots, Volume Bots, Bundle
                  Snipe Bots, and Holder Bots. Each bot type is designed for specific trading strategies and market
                  conditions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="bot-security">
                <AccordionTrigger>How secure are the trading bots?</AccordionTrigger>
                <AccordionContent>
                  Security is our top priority. All bots operate with the permissions you grant, and we never have
                  access to your private keys. We use industry-standard security practices and regular audits to ensure
                  the platform remains secure.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="bot-fees">
                <AccordionTrigger>What are the fees for using trading bots?</AccordionTrigger>
                <AccordionContent>
                  Valmira uses a subscription model with different tiers based on your needs. Each tier provides access
                  to different bot types and features. Additionally, there's a small performance fee on profitable
                  trades. Check our pricing page for detailed information.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="bot-performance">
                <AccordionTrigger>How can I track my bot's performance?</AccordionTrigger>
                <AccordionContent>
                  Each project has a dedicated analytics dashboard where you can monitor key metrics like profit/loss,
                  number of trades, success rate, and more. You can also set up notifications for important events and
                  performance milestones.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account & Wallet</CardTitle>
            <CardDescription>Questions about account management and wallet connections</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="wallet-types">
                <AccordionTrigger>Which wallets are supported?</AccordionTrigger>
                <AccordionContent>
                  Valmira supports most major Web3 wallets including MetaMask, WalletConnect, Coinbase Wallet, and Trust
                  Wallet. We're continuously adding support for additional wallet providers.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="account-security">
                <AccordionTrigger>How is my account secured?</AccordionTrigger>
                <AccordionContent>
                  Your account is secured through blockchain authentication. We never store your private keys or seed
                  phrases. For additional security, we recommend enabling two-factor authentication in your profile
                  settings.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="disconnect-wallet">
                <AccordionTrigger>How do I disconnect my wallet?</AccordionTrigger>
                <AccordionContent>
                  You can disconnect your wallet by clicking on your profile in the sidebar and selecting "Disconnect
                  Wallet". This will end your current session, and you'll need to reconnect your wallet to access your
                  account again.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

