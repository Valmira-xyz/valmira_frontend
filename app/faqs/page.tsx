// import type { Metadata } from 'next';
'use client';

import { motion } from 'framer-motion';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
// export const metadata: Metadata = {
//   title: 'FAQs | Valmira',
//   description: 'Frequently asked questions about Valmira platform and services',
// };

export default function FAQsPage() {
  return (
    <motion.div
      className="grid gap-6 p-4 md:p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border">
        <CardHeader>
          <CardTitle className="font-tt">General Questions</CardTitle>
          <CardDescription>
            Fundamental questions about Valmira platform and how it helps token
            creators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-is-valmira">
              <AccordionTrigger className="text-start">
                What is Valmira?
              </AccordionTrigger>
              <AccordionContent>
                Valmira is a comprehensive platform that helps cryptocurrency
                token creators and project owners manage and grow their tokens
                without needing technical expertise. Think of it as your
                personal assistant for everything related to making your token
                successful in the market. Whether you've just created a new
                token or imported an existing one, Valmira provides automated
                tools (called "bots") that handle complex tasks like generating
                trading volume, creating holders, managing liquidity, and
                protecting your investment.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="non-technical-help">
              <AccordionTrigger className="text-start">
                I'm not a technical person. How can Valmira help me with my new
                token?
              </AccordionTrigger>
              <AccordionContent>
                Perfect! Valmira was designed specifically for non-technical
                users like you. Here's how it helps:
                <br />
                <br />
                <strong>No Coding Required:</strong> Everything is done through
                simple, user-friendly interfaces with clear buttons and forms
                <br />
                <strong>Automated Market Support:</strong> Our bots work 24/7 to
                support your token's market presence
                <br />
                <strong>Revenue Generation:</strong> Many of our tools can help
                generate trading fees and profits from your token
                <br />
                <strong>Professional Results:</strong> Get the same
                market-making capabilities that big projects use, but simplified
                for everyday users
                <br />
                <strong>Step-by-Step Guidance:</strong> Each feature comes with
                clear instructions and recommended settings
                <br />
                <br />
                You simply create a project, choose which bots you want to
                activate, deposit some cryptocurrency to fund them, and let
                Valmira handle the technical work while you focus on growing
                your community and project.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="market-making">
              <AccordionTrigger className="text-start">
                What is "market making" and why is it critical for my token's
                success?
              </AccordionTrigger>
              <AccordionContent>
                Imagine your token is like a new restaurant in town. Market
                making is like having customers constantly coming in and out,
                creating buzz and activity. Here's why it matters:
                <br />
                <br />
                <strong>The Simple Explanation:</strong> Market making means
                creating consistent buying and selling activity for your token.
                When people see active trading, they perceive your token as
                legitimate and valuable.
                <br />
                <br />
                <strong>Why It's Critical:</strong>
                <br />
                <strong>Builds Trust:</strong> Investors are more likely to buy
                tokens that show consistent trading activity
                <br />
                <strong>Improves Visibility:</strong> Trading platforms and
                tracking websites rank active tokens higher
                <br />
                <strong>Creates Liquidity:</strong> Makes it easier for people
                to buy and sell your token
                <br />
                <strong>Prevents Price Manipulation:</strong> Consistent
                activity makes it harder for bad actors to manipulate your
                token's price
                <br />
                <br />
                <strong>Real-World Analogy:</strong> It's like having a busy
                coffee shop versus an empty one. People naturally gravitate
                toward the busy one because it signals quality and popularity.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="volume-generation">
              <AccordionTrigger className="text-start">
                What is "volume generation" and why does it matter?
              </AccordionTrigger>
              <AccordionContent>
                Volume generation is the process of creating trading activity
                (buying and selling) for your token. Think of it as creating a
                heartbeat for your token's market presence.
                <br />
                <br />
                <strong>Why Volume Matters:</strong>
                <br />
                <strong>Market Ranking:</strong> Platforms like CoinMarketCap
                and CoinGecko rank tokens partly based on trading volume
                <br />
                <strong>Investor Confidence:</strong> High volume signals that
                your token is actively used and traded
                <br />
                <strong>Price Stability:</strong> More trading activity
                typically leads to more stable prices
                <br />
                <strong>Exchange Listings:</strong> Many exchanges require
                minimum volume levels before they'll list your token
                <br />
                <br />
                <strong>How Valmira Helps:</strong> Our Volume Bot automatically
                creates natural-looking trading patterns using multiple wallets,
                so your token appears actively traded without you having to
                manually buy and sell constantly.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="crypto-sniping">
              <AccordionTrigger className="text-start">
                What is "sniping" in crypto and how does Valmira handle it?
              </AccordionTrigger>
              <AccordionContent>
                "Sniping" in cryptocurrency refers to the practice of quickly
                buying tokens the moment they become available for trading,
                often at launch or when liquidity is first added. There are two
                sides to this:
                <br />
                <br />
                <strong>The Problem:</strong> Malicious snipers (often bots) can
                buy large amounts of your token immediately when you launch,
                then sell quickly for profit, which can hurt your token's price
                and community.
                <br />
                <br />
                <strong>The Solution:</strong> Valmira's Bundle Snipe Bot turns
                this concept into a protective and profitable tool for YOU:
                <br />
                <strong>Protective Sniping:</strong> Our bot can help you secure
                a good position in your own token at launch
                <br />
                <strong>Profitable Opportunities:</strong> The bot can identify
                and capitalize on trading opportunities in transaction bundles
                <br />
                <strong>Fair Launch Support:</strong> Helps ensure your
                community gets fair access to your token rather than being
                dominated by external sniper bots
                <br />
                <br />
                <strong>Simple Analogy:</strong> It's like having a bodyguard
                who's also an expert shopper - they protect you from bad actors
                while also finding great deals.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader>
          <CardTitle className="font-tt">
            How-To Guides - Step-by-Step Actions
          </CardTitle>
          <CardDescription>
            Practical questions about using Valmira's features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="create-first-project">
              <AccordionTrigger className="text-start">
                How do I create my first project?
              </AccordionTrigger>
              <AccordionContent>
                Creating your first project is simple and takes just a few
                minutes:
                <br />
                <br />
                <strong>Step 1: Access the Project Creation</strong>
                <br />
                - Log into your Valmira dashboard
                <br />
                - Click the "Create Project" button (usually prominently
                displayed)
                <br />
                - Choose between "Deploy New Token" or "Import Existing Token"
                <br />
                <br />
                <strong>Step 2: Choose Your Method</strong>
                <br />- <strong>Deploy New Token:</strong> If you want to create
                a brand new token (Enter token name, symbol, total supply, set
                taxes, choose blockchain)
                <br />- <strong>Import Existing Token:</strong> If you already
                have a token (Enter your token's contract address)
                <br />
                <br />
                <strong>Step 3: Configure Project Details</strong>
                <br />
                - Add project name and description
                <br />
                - Optionally add social media links
                <br />
                - Review all settings before confirming
                <br />
                <br />
                <strong>Step 4: Confirm and Create</strong>
                <br />
                - Review all details carefully
                <br />
                - Click "Create Project"
                <br />- Wait for confirmation (usually takes 1-2 minutes)
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bsc-vs-eth">
              <AccordionTrigger className="text-start">
                How do I create a project on BSC? What about on ETH?
              </AccordionTrigger>
              <AccordionContent>
                <strong>Creating a BSC Project:</strong>
                <br />
                1. Network Selection: When creating your project, select
                "BSC_MAINNET" as your blockchain
                <br />
                2. Wallet Setup: Ensure your wallet is connected to Binance
                Smart Chain
                <br />
                3. Funding: You'll need BNB for transaction fees and bot funding
                <br />
                4. Token Requirements: Your token must be compatible with
                PancakeSwap V2
                <br />
                5. Minimum Funding: Most bots require at least 0.1 BNB to start
                <br />
                <br />
                <strong>Creating an ETH Project:</strong>
                <br />
                1. Network Selection: Choose "ETH_MAINNET" as your blockchain
                <br />
                2. Wallet Setup: Connect your wallet to Ethereum mainnet
                <br />
                3. Funding: You'll need ETH for gas fees and bot operations
                <br />
                4. Higher Costs: Ethereum gas fees are typically higher than BSC
                <br />
                5. Minimum Funding: Start with at least 0.05 ETH due to higher
                gas costs
                <br />
                <br />
                <strong>Recommendation for Beginners:</strong> Start with BSC
                due to lower costs and faster transactions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="wallet-and-liquidity">
              <AccordionTrigger className="text-start">
                How do I get a wallet and add liquidity for my project?
              </AccordionTrigger>
              <AccordionContent>
                <strong>Getting a Wallet:</strong>
                <br />
                1. Choose a Wallet: MetaMask (most popular), Trust Wallet
                (mobile-friendly), or WalletConnect
                <br />
                2. Install and Setup: Download from official website, create new
                wallet or import existing one
                <br />
                3. CRITICAL: Save your seed phrase securely (write it down,
                store safely)
                <br />
                4. Add Networks: Add BSC network for BSC projects, ETH is
                usually pre-configured
                <br />
                5. Get Native Currency: Buy BNB/ETH on an exchange and transfer
                to your wallet
                <br />
                <br />
                <strong>Adding Liquidity:</strong>
                <br />
                1. Prepare Your Tokens: Ensure you have both your token and
                native currency in your wallet
                <br />
                2. Access Liquidity Tools: Use Valmira's built-in "Manual LP"
                dialog or go to PancakeSwap/Uniswap
                <br />
                3. Add Liquidity: Select your token and native currency pair,
                enter amounts, approve transactions
                <br />
                4. Receive LP Tokens: Keep these safe - you need them to remove
                liquidity later
                <br />
                <br />
                <strong>Important Tips:</strong> Start with small amounts to
                test, always double-check token addresses, keep some native
                currency for fees.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="activate-bot">
              <AccordionTrigger className="text-start">
                How do I activate a bot for my project?
              </AccordionTrigger>
              <AccordionContent>
                <strong>Step 1: Access Your Project</strong>
                <br />
                - Go to your Valmira dashboard
                <br />
                - Click on the project where you want to activate a bot
                <br />
                - Navigate to the "Add-ons" or "Bots" section
                <br />
                <br />
                <strong>Step 2: Choose Your Bot</strong>
                <br />
                - Browse available bots (Volume Bot, Holder Bot, etc.)
                <br />
                - Click on the bot you want to activate
                <br />
                - Read the description and requirements
                <br />
                <br />
                <strong>Step 3: Configure the Bot</strong>
                <br />
                - Enable the Bot: Toggle the switch to "ON"
                <br />
                - Configure Settings: Set parameters like amounts, timing,
                targets
                <br />
                - Review Costs: Check the estimated fees and requirements
                <br />
                <br />
                <strong>Step 4: Fund the Bot</strong>
                <br />
                - Get Deposit Address: The system provides a unique wallet
                address for the bot
                <br />
                - Send Funds: Transfer the required native currency to this
                address
                <br />
                - Wait for Confirmation: Usually takes 1-3 minutes
                <br />
                <br />
                <strong>Step 5: Execute the Bot</strong>
                <br />
                - Once funded, click the "Execute" or "Start" button
                <br />- Monitor the bot's status in your dashboard
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="multiple-bots">
              <AccordionTrigger className="text-start">
                Can I activate more than one bot at a time? How?
              </AccordionTrigger>
              <AccordionContent>
                Yes! Running multiple bots simultaneously is not only possible
                but recommended for optimal results.
                <br />
                <br />
                <strong>How to Activate Multiple Bots:</strong>
                <br />
                1. Sequential Activation: Activate one bot at a time following
                the standard process
                <br />
                2. Independent Funding: Each bot requires its own funding in its
                dedicated wallet
                <br />
                3. Separate Monitoring: Each bot operates independently
                <br />
                <br />
                <strong>Recommended Bot Combinations:</strong>
                <br />
                <strong>For New Projects:</strong> Volume Bot + Holder Bot
                (Creates trading activity and diverse holder base)
                <br />
                <strong>For Established Projects:</strong> Distribution Bot +
                Volume Bot (Distribute tokens while maintaining activity)
                <br />
                <strong>For Advanced Users:</strong> All Bots for comprehensive
                management
                <br />
                <br />
                <strong>Management Tips:</strong>
                <br />
                - Stagger Activation: Don't activate all bots simultaneously
                <br />
                - Adequate Funding: Ensure each bot has sufficient funds
                <br />
                - Regular Monitoring: Check all bot statuses daily
                <br />- Start with 2-3 bots maximum until you're experienced
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pause-vs-stop">
              <AccordionTrigger className="text-start">
                What is the difference between pausing and stopping a bot?
              </AccordionTrigger>
              <AccordionContent>
                <strong>Pausing a Bot:</strong>
                <br />
                - Temporary: Meant for short-term breaks
                <br />
                - Preserves Everything: Settings, funds, and configuration
                remain intact
                <br />
                - Quick Resume: Can restart immediately with same settings
                <br />
                - Funds Stay: Money remains in bot's wallet ready for use
                <br />
                - Use Cases: Market volatility, brief maintenance, temporary
                strategy changes
                <br />
                <br />
                <strong>Stopping a Bot:</strong>
                <br />
                - Permanent: Meant for long-term or permanent discontinuation
                <br />
                - Funds Withdrawn: You actively remove all deposited funds
                <br />
                - Settings May Reset: Some configurations might return to
                defaults
                <br />
                - Clean Shutdown: Complete cessation of all bot activities
                <br />
                - Use Cases: Strategy change, project completion, moving to
                different platform
                <br />
                <br />
                <strong>Decision Guide:</strong>
                <br />
                Choose Pause If: You plan to resume within days/weeks, want to
                keep settings
                <br />
                Choose Stop If: You're done with the bot long-term, need funds
                for other purposes
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="recover-funds">
              <AccordionTrigger className="text-start">
                How do I recover or withdraw all my funds from the platform?
              </AccordionTrigger>
              <AccordionContent>
                <strong>Complete Fund Recovery Process:</strong>
                <br />
                <br />
                <strong>Step 1: Inventory Your Assets</strong>
                <br />
                - Check All Projects: Review every project in your dashboard
                <br />
                - List All Bots: Identify every active or paused bot
                <br />
                - Note Wallet Addresses: Record all deposit wallet addresses
                <br />
                - Check Balances: Verify native currency and token balances
                <br />
                <br />
                <strong>Step 2: Stop All Bot Activities</strong>
                <br />
                - Pause All Bots: Temporarily pause every active bot
                <br />
                - Wait for Completion: Allow ongoing transactions to finish
                (5-10 minutes)
                <br />
                - Verify Stopped: Confirm all bots show "Paused" status
                <br />
                <br />
                <strong>Step 3: Withdraw from Each Bot</strong>
                <br />
                - Access Each Bot: Go through each bot individually
                <br />
                - Check Deposit Wallet: View the bot's deposit wallet balance
                <br />
                - Initiate Withdrawal: Use "Withdraw" or "Transfer" functions
                <br />
                - Destination Address: Send to your main wallet address
                <br />
                - Confirm Transactions: Wait for blockchain confirmation
                <br />
                <br />
                <strong>Important Considerations:</strong>
                <br />
                - Gas Fees: Keep some native currency for withdrawal transaction
                fees
                <br />
                - Network Congestion: Withdrawals may take longer during busy
                periods
                <br />- Emergency Recovery: Contact Valmira support if you can't
                access normal withdrawal process
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader>
          <CardTitle className="font-tt">Trading Bots & Projects</CardTitle>
          <CardDescription>
            Questions about setting up and managing trading bots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="bot-types">
              <AccordionTrigger className="text-start">
                What types of trading bots are available?
              </AccordionTrigger>
              <AccordionContent>
                Valmira offers several types of trading bots including:
                <br />
                <br />
                <strong>Volume Bot:</strong> Creates natural-looking trading
                activity to boost your token's metrics
                <br />
                <strong>Holder Bot:</strong> Generates diverse holder base
                across multiple wallets
                <br />
                <strong>Distribution Bot:</strong> Bulk token distribution with
                gas optimization
                <br />
                <strong>Auto Sell Bot:</strong> Automated profit protection with
                stop-loss features
                <br />
                <strong>Bundle Snipe Bot:</strong> Advanced trading
                opportunities capture
                <br />
                <br />
                Each bot type is designed for specific strategies and can be
                combined for comprehensive token management.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="supported-chains">
              <AccordionTrigger className="text-start">
                Which blockchain networks are supported?
              </AccordionTrigger>
              <AccordionContent>
                Valmira currently supports:
                <br />
                <strong>BSC (Binance Smart Chain):</strong> Lower fees, faster
                transactions, PancakeSwap integration
                <br />
                <strong>Ethereum Mainnet:</strong> Higher fees, slower
                transactions, Uniswap integration
                <br />
                <strong>Recommendation for Beginners:</strong> Start with BSC
                due to lower costs and faster transactions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bot-security">
              <AccordionTrigger className="text-start">
                How secure are the trading bots?
              </AccordionTrigger>
              <AccordionContent>
                Security is our top priority. All bots operate with the
                permissions you grant, and we never have access to your private
                keys. We use industry-standard security practices and regular
                audits to ensure the platform remains secure.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bot-fees">
              <AccordionTrigger className="text-start">
                What are the fees for using trading bots?
              </AccordionTrigger>
              <AccordionContent>
                <strong>Minimum Requirements:</strong>
                <br />
                BSC Projects: Minimum 0.1 BNB for most bots
                <br />
                Ethereum Projects: Minimum 0.05 ETH for most bots
                <br />
                <br />
                <strong>Cost Management Tips:</strong>
                <br />
                - Start Small: Begin with minimum deposits to understand costs
                <br />
                - Monitor Spending: Track bot performance vs. costs regularly
                <br />
                - Optimize Settings: Adjust parameters to balance performance
                and costs
                <br />- Network Choice: Use BSC for lower costs, ETH for larger
                projects
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bot-performance">
              <AccordionTrigger className="text-start">
                How can I track my bot's performance?
              </AccordionTrigger>
              <AccordionContent>
                Each project has a dedicated analytics dashboard where you can
                monitor key metrics like profit/loss, number of trades, success
                rate, and more. You can also set up notifications for important
                events and performance milestones.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader>
          <CardTitle className="font-tt">Account & Wallet</CardTitle>
          <CardDescription>
            Questions about account management and wallet connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="wallet-types">
              <AccordionTrigger className="text-start">
                Which wallets are supported?
              </AccordionTrigger>
              <AccordionContent>
                Valmira supports most major Web3 wallets including MetaMask,
                WalletConnect, Coinbase Wallet, and Trust Wallet. We're
                continuously adding support for additional wallet providers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="account-security">
              <AccordionTrigger className="text-start">
                How is my account secured?
              </AccordionTrigger>
              <AccordionContent>
                Your account is secured through blockchain authentication. We
                never store your private keys or seed phrases. For additional
                security, we recommend enabling two-factor authentication in
                your profile settings.
                <br />
                <br />
                <strong>Security Best Practices:</strong>
                <br />
                - Never share your private keys or seed phrases
                <br />
                - Always verify wallet addresses before sending funds
                <br />
                - Start with small amounts to test functionality
                <br />
                - Keep your wallet software updated
                <br />- Use strong passwords and enable 2FA where possible
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="disconnect-wallet">
              <AccordionTrigger className="text-start">
                How do I disconnect my wallet?
              </AccordionTrigger>
              <AccordionContent>
                You can disconnect your wallet by clicking on your profile in
                the sidebar and selecting "Disconnect Wallet". This will end
                your current session, and you'll need to reconnect your wallet
                to access your account again.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
}
