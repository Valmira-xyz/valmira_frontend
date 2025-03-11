"use client"

import { Provider } from "react-redux"
import { store } from "@/store/store"
import { SessionProvider } from "@/components/session-provider"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { wagmiAdapter, projectId } from "@/lib/web3modal"
import { createAppKit } from '@reown/appkit/react' 
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { bsc, bscTestnet } from "viem/chains"
import { ReactNode } from "react"
import { WalletProvider } from "@/components/wallet/wallet-provider"
import { AuthProvider } from "@/components/AuthProvider"

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'valmira_frontend',
  description: 'The first innovated multi chain meme launchpad',
  url: 'https://reown.com/appkit', // origin must match your domain & subdomain
  icons: ['https://assets.reown.com/reown-profile-pic.png']
}

// Create the modal
export const web3modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [bsc, bscTestnet],
  defaultNetwork: bsc,
  metadata: metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  }
})

export function Providers({ children, cookies }: { children: ReactNode; cookies: string | null }){
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <Provider store={store}>
      <SessionProvider>
        <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <WalletProvider>
                <AuthProvider>
                  <SidebarProvider>
                    <div className="flex min-h-screen bg-gradient-to-br from-background to-background/80">
                      <DashboardSidebar />
                      <div className="flex flex-col flex-1 transition-all duration-300 ease-in-out">
                        <main className="flex-1 px-6 py-6">{children}</main>
                      </div>
                    </div>
                  </SidebarProvider>
                </AuthProvider>
              </WalletProvider>
            </ThemeProvider>
          </QueryProvider>
        </WagmiProvider>
      </SessionProvider>
      <Toaster />
    </Provider>
  )
} 