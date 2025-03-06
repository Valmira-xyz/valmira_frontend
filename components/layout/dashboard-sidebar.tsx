"use client"
import { useState } from "react"
import {
  LayoutDashboard,
  FolderKanban,
  HelpCircle,
  Settings,
  ChevronDown,
  BookOpen,
  HelpCircleIcon,
  Circle,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { useSelector } from "react-redux"
import { WalletConnectionButton } from "@/components/wallet/wallet-connection-button"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAccount } from "wagmi"
import { WalletDisplay } from "../wallet/wallet-display"

// Sample data for active projects - replace with real data from your state
const sampleProjects = [
  { id: "1", name: "PEPE", status: "active", tokenSymbol: "PEPE" },
  { id: "2", name: "SHIB", status: "paused", tokenSymbol: "SHIB" },
  { id: "3", name: "DOGE", status: "active", tokenSymbol: "DOGE" },
]

export function DashboardSidebar() {

  const { isConnected } = useAccount()

  const [openProjects, setOpenProjects] = useState(false)
  const [openKnowledge, setOpenKnowledge] = useState(false)

  // Get wallet info from Redux store
  const { walletAddress, isAuthenticated, projects } = useSelector((state: any) => state.user)

  // Sample stats - replace with real data
  const stats = {
    activeProjects: 2,
    cumulativeProfit: "$1,245.67",
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4 relative w-full">
        <h2 className="text-2xl font-bold text-primary">Valmira</h2>
      </SidebarHeader>
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4">
      {isConnected ? (
          <WalletDisplay variant="sidebar" />
        ) : (
          <WalletConnectionButton />
        )}
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/" className="flex items-center pl-5">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Projects with submenu */}
          <Collapsible open={openProjects} onOpenChange={setOpenProjects}>
            <SidebarMenuItem>
              <CollapsibleTrigger className="flex items-center justify-between w-full pl-5 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                <div className="flex items-center">
                  <FolderKanban className="mr-2 h-4 w-4" />
                  <span>Projects</span>
                </div>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform mr-2", openProjects && "transform rotate-180")}
                />
              </CollapsibleTrigger>
            </SidebarMenuItem>
            <CollapsibleContent>
              <div className="ml-7 space-y-1">
                {sampleProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
                  >
                    <div className="flex items-center">
                      <Circle
                        className={cn(
                          "h-2 w-2 mr-2",
                          project.status === "active" ? "text-green-500 animate-pulse" : "text-yellow-500",
                        )}
                      />
                      <span>{project.tokenSymbol}</span>
                    </div>
                    <Badge variant={project.status === "active" ? "default" : "outline"}>{project.status}</Badge>
                  </Link>
                ))}
                <Link
                  href="/projects"
                  className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
                >
                  View all projects...
                </Link>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Knowledge Base with submenu */}
          <Collapsible open={openKnowledge} onOpenChange={setOpenKnowledge}>
            <SidebarMenuItem>
              <CollapsibleTrigger className="flex items-center justify-between w-full pl-5 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                <div className="flex items-center">
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Knowledge Base</span>
                </div>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform mr-2", openKnowledge && "transform rotate-180")}
                />
              </CollapsibleTrigger>
            </SidebarMenuItem>
            <CollapsibleContent>
              <div className="ml-7 space-y-1">
                <Link
                  href="/tutorials"
                  className="flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Tutorials</span>
                </Link>
                <Link
                  href="/faqs"
                  className="flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
                >
                  <HelpCircleIcon className="mr-2 h-4 w-4" />
                  <span>FAQs</span>
                </Link>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings" className="flex items-center pl-5">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Profile section at the bottom */}
        <div className="mt-auto border-t border-border p-4 space-y-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {walletAddress ? walletAddress.substring(0, 2) : "WA"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {walletAddress
                      ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
                      : "Not connected"}
                  </p>
                  <p className="text-xs text-muted-foreground">Ethereum</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Active Projects</span>
                  <span className="font-medium">{stats.activeProjects}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Total Profit</span>
                  <span className="font-medium">{stats.cumulativeProfit}</span>
                </div>
              </div>

              <button className="flex items-center justify-center w-full text-sm text-destructive hover:text-destructive/90">
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect Wallet
              </button>
            </>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              <p>Connect your wallet to see your profile</p>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}

