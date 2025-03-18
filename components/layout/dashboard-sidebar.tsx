"use client"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  FolderKanban,
  HelpCircle,
  Settings,
  ChevronDown,
  BookOpen,
  Circle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { WalletConnectionButton } from "@/components/wallet/wallet-connection-button"
import { RootState } from "@/store/store"
import { generateAvatarColor, getBadgeVariant } from '@/lib/utils'
import { fetchProjects } from "@/store/slices/projectSlice"

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

export function DashboardSidebar() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { isConnected } = useAccount()
  const [openProjects, setOpenProjects] = useState(false)
  const [openKnowledge, setOpenKnowledge] = useState(false)

  // Get auth state from Redux store
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects)

  // Fetch projects when component mounts
  useEffect(() => {
    if (isAuthenticated && isConnected) {
      dispatch(fetchProjects() as any)
    }
  }, [dispatch, isAuthenticated, isConnected])

  const activeProjects = projects?.filter(project => project.status === 'active') ?? [];
  const avatarColor = generateAvatarColor(user?.walletAddress || "")


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
        
          <SidebarMenuButton onClick={() => router.push("/")} className="flex items-center pl-5">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </SidebarMenuButton>

        {/* Projects with submenu */}
        <Collapsible open={openProjects} onOpenChange={setOpenProjects}>
      
            <CollapsibleTrigger className="flex items-center justify-between w-full pl-5 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">
              <div className="flex items-center">
                <FolderKanban className="mr-2 h-4 w-4" />
                <span>Projects</span>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform mr-2", openProjects && "transform rotate-180")}
              />
            </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="ml-7 space-y-1">
              { projects && projects.length > 0 ? (
                <>
                  {projects.map((project) => (
                    <button
                      key={project._id}
                      onClick={() => router.push(`/projects/${project._id}`)}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
                    >
                      <div className="flex items-center">
                        <Circle className="h-2 w-2 mr-2 text-green-500 animate-pulse" />
                        <span>{project.name}</span>
                      </div>
                      <Badge variant={getBadgeVariant(project.status)} className="font-medium text-sm px-3 py-1 rounded-full">
                        {project.status}
                      </Badge>
                    </button>
                  ))}
                  <button
                    onClick={() => router.push("/projects")}
                    className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
                  >
                    Your projects...
                  </button>
                  <button
                    onClick={() => router.push("/public-projects")}
                    className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
                  >
                    View all projects...
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 py-2 text-sm text-muted-foreground">No active projects</div>
                  <button
                    onClick={() => router.push("/public-projects")}
                    className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
                  >
                    Browse public projects...
                  </button>
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Knowledge Base with submenu */}
        <Collapsible open={openKnowledge} onOpenChange={setOpenKnowledge}>

            <CollapsibleTrigger className="flex items-center justify-between w-full pl-5 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Knowledge Base</span>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform mr-2", openKnowledge && "transform rotate-180")}
              />
            </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="ml-7 space-y-1">
              <button
                onClick={() => router.push("/docs/getting-started")}
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
              >
                Getting Started
              </button>
              <button
                onClick={() => router.push("/docs/tutorials")}
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
              >
                Tutorials
              </button>
              <button
                onClick={() => router.push("/docs/api")}
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
              >
                API Reference
              </button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Help & Support */}

          <SidebarMenuButton onClick={() => router.push("/support")} className="flex items-center pl-5">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </SidebarMenuButton>


        {/* Settings */}

          <SidebarMenuButton onClick={() => router.push("/settings")} className="flex items-center pl-5">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </SidebarMenuButton>


        {/* Profile section at the bottom */}
        <div className="mt-auto border-t border-border p-4 space-y-4">
          {isAuthenticated && isConnected && user ? (
            <>
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback style={{ backgroundColor: avatarColor }}>
                    {user.walletAddress?.substring(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name || `${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 4)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Active Projects</span>
                  <span className="font-medium">{activeProjects?.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Total Profit</span>
                  <span className="font-medium">{projects?.reduce((total, project) => total + (project.metrics?.cumulativeProfit || 0), 0)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              <p>Connect your wallet and login to see your profile</p>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}

