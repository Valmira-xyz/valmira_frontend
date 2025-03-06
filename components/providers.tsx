"use client"

import { Provider } from "react-redux"
import { store } from "@/lib/redux/store"
import { SessionProvider } from "@/components/session-provider"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProvider } from "@/components/wallet/wallet-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionProvider>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <WalletProvider>
              <SidebarProvider>
                <div className="flex min-h-screen bg-gradient-to-br from-background to-background/80">
                  <DashboardSidebar />
                  <div className="flex flex-col flex-1 transition-all duration-300 ease-in-out">
                    <DashboardHeader />
                    <main className="flex-1 px-6 py-6">{children}</main>
                  </div>
                </div>
              </SidebarProvider>
            </WalletProvider>
          </ThemeProvider>
        </QueryProvider>
      </SessionProvider>
      <Toaster />
    </Provider>
  )
} 