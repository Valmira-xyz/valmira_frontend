'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiRepeat } from 'react-icons/fi';
import { IoIosLink } from 'react-icons/io';
import { LuSettings2 } from 'react-icons/lu';
import { LuClipboardPen } from 'react-icons/lu';
import { LuUsersRound } from 'react-icons/lu';
import { LuPlay } from 'react-icons/lu';
import { MdOutlineWidgets } from 'react-icons/md';
import { useSelector } from 'react-redux';

import {
  AlertCircleIcon,
  BookOpen,
  Calculator,
  ChevronDown,
  Circle,
  FolderKanban,
  HomeIcon,
  Settings,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRef,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { getBadgeVariant } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Logo from '@/public/sidebar/logo.svg';
import { config } from '@/services/config';
import { projectService } from '@/services/projectService';
import websocketService, { WebSocketEvents } from '@/services/websocketService';
import { RootState } from '@/store/store';

import { WalletConnectionButton } from '../wallet/wallet-connection-button';
import { WalletDisplay } from '../wallet/wallet-display';

// Configure which embed paths should hide the sidebar
const EMBED_WIDGET_PATHS = [
  '/embed/tokenboost',
  '/embed/widget',
  // Add more clean widget paths here in the future
  // '/embed/new-widget',
  // '/embed/partner-widget',
];

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected } = useAccount();
  // const dispatch = useDispatch();

  // Don't render sidebar on specific embed widget pages
  if (EMBED_WIDGET_PATHS.includes(pathname)) {
    return null;
  }

  // Initialize collapsible states based on current path
  const [openProjects, setOpenProjects] = useState(
    () => pathname.startsWith('/projects') || pathname === '/public-projects'
  );
  const [openYourProjects, setOpenYourProjects] = useState(
    () =>
      pathname.startsWith('/projects') &&
      pathname !== '/projects/fee-calculator' &&
      pathname !== '/public-projects'
  );

  const [openPacks, setOpenPacks] = useState(() =>
    pathname.startsWith('/public-packs')
  );

  const [openYourPacks, setOpenYourPacks] = useState(() =>
    pathname.startsWith('/packs')
  );

  const [openKnowledge, setOpenKnowledge] = useState(
    () => pathname.startsWith('/tutorials') || pathname.startsWith('/faqs')
  );
  const [openAmbassador, setOpenAmbassador] = useState(() =>
    pathname.startsWith('/ambassador')
  );

  const { open, setOpen, isMobile } = useSidebar();

  const [mounted, setMounted] = useState(false);
  const [updatedTotalProfit, setUpdatedTotalProfit] = useState<number | null>(
    null
  );
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [userPacks, setUserPacks] = useState<any[]>([]);
  const loadingRef = useRef(false);
  const loadingPacksRef = useRef(false);

  // Get auth state from Redux store
  const { user, isAuthenticated, isAdmin } = useSelector(
    (state: RootState) => state.auth
  );

  const sidebarRef = useRef<SidebarRef>(null);

  // Set mounted state to true after component mounts
  // Update collapsible states when pathname changes
  useEffect(() => {
    setMounted(true);

    // Don't close dropdowns - just open the relevant ones based on current path
    // This allows users to keep multiple dropdowns open

    // Open the relevant collapsible based on the current path
    if (pathname.startsWith('/projects') || pathname === '/public-projects') {
      setOpenProjects(true);
      if (
        pathname.startsWith('/projects') &&
        pathname !== '/projects/fee-calculator' &&
        pathname !== '/public-projects'
      ) {
        setOpenYourProjects(true);
      }
    } else if (pathname.startsWith('/packs') || pathname === '/public-packs') {
      setOpenPacks(true);
      if (pathname.startsWith('/packs')) {
        setOpenYourPacks(true);
      }
    } else if (
      pathname.startsWith('/tutorials') ||
      pathname.startsWith('/faqs')
    ) {
      setOpenKnowledge(true);
    } else if (pathname.startsWith('/ambassador')) {
      setOpenAmbassador(true);
    }
  }, [pathname]);

  // Fetch user's projects
  const fetchUserProjects = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    // Prevent multiple simultaneous calls using ref
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      const allProjects = await projectService.getProjects();

      // Filter projects for the current user
      const filteredProjects = allProjects.filter((project) => {
        if ('owner' in project) {
          const ownerObj = project.owner as {
            _id?: string;
            walletAddress?: string;
          };
          return (
            ownerObj?._id === user?._id ||
            ownerObj?.walletAddress?.toLowerCase() ===
              user?.walletAddress?.toLowerCase()
          );
        }
        return false;
      });

      setUserProjects(filteredProjects);
    } catch (error) {
      console.error('Error fetching user projects:', error);
    } finally {
      loadingRef.current = false;
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  // Fetch user's packs directly from backend to ensure real-time status
  const fetchUserPacks = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    // Prevent multiple simultaneous calls using ref
    if (loadingPacksRef.current) return;

    try {
      loadingPacksRef.current = true;

      // Fetch fresh data directly from backend instead of Redux store
      const response = await fetch(
        `${config.apiUrl}/projects?isProject=false`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch packs');
      }

      const result = await response.json();
      const allPacks = result.data.projects; // Backend returns as projects but they're actually packs

      // Filter packs for the current user
      const filteredPacks = allPacks.filter((pack: any) => {
        if ('owner' in pack) {
          const ownerObj = pack.owner as {
            _id?: string;
            walletAddress?: string;
          };
          return (
            ownerObj?._id === user?._id ||
            ownerObj?.walletAddress?.toLowerCase() ===
              user?.walletAddress?.toLowerCase()
          );
        }
        return false;
      });

      // console.log('[filteredPacks fresh from backend]', filteredPacks);

      setUserPacks(filteredPacks);
    } catch (error) {
      console.error('Error fetching user packs:', error);
    } finally {
      loadingPacksRef.current = false;
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchUserPacks();
  }, [fetchUserPacks]);

  // Add periodic refresh for pack data to ensure real-time status updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Refresh pack data every 30 seconds to keep status current
    const interval = setInterval(() => {
      fetchUserPacks();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, fetchUserPacks]);

  // Clear projects and packs when user disconnects/logs out
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUserProjects([]);
      setUserPacks([]);
    }
  }, [isAuthenticated, user]);

  // Listen for project changes (creation/deletion)
  useEffect(() => {
    const handleProjectsChanged = () => {
      fetchUserProjects();
    };

    // Listen for custom project changes event
    window.addEventListener('projectsChanged', handleProjectsChanged);

    return () => {
      window.removeEventListener('projectsChanged', handleProjectsChanged);
    };
  }, [fetchUserProjects]);

  // Listen for pack changes (creation/deletion)
  useEffect(() => {
    const handlePacksChanged = () => {
      fetchUserPacks();
    };

    // Listen for custom pack changes event
    window.addEventListener('packsChanged', handlePacksChanged);

    return () => {
      window.removeEventListener('packsChanged', handlePacksChanged);
    };
  }, [fetchUserPacks]);

  // Filter projects to show only the authenticated user's projects,
  // sort by status (active first) then by updatedAt date (newest first),
  // and limit to 10 projects for the sidebar
  const filteredAndSortedProjects =
    userProjects
      ?.sort((a, b) => {
        // First sort by status (active first)
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;

        // Then sort by updatedAt date (newest first)
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      })
      ?.slice(0, 10) || []; // Limit to 10 projects for the sidebar

  // Filter packs to show only the authenticated user's packs,
  // sort by status (active first) then by updatedAt date (newest first),
  // and limit to 10 packs for the sidebar
  const filteredAndSortedPacks =
    userPacks
      ?.sort((a, b) => {
        // First sort by status (active first) - use pack.status directly from backend
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;

        // Then sort by updatedAt date (newest first)
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      })
      ?.slice(0, 10) || []; // Limit to 10 packs for the sidebar

  const activeProjects = userProjects.filter(
    (project) => project.status === 'active'
  );

  // Calculate total profit based on all user projects
  const totalProfit =
    updatedTotalProfit !== null
      ? updatedTotalProfit
      : userProjects?.reduce(
          (total, project) => total + (project.metrics?.cumulativeProfit || 0),
          0
        );

  // Handle project metrics updates from WebSocket
  const handleMetricsUpdate = useCallback(
    (data: any) => {
      if (data.projectId && data.metrics && userProjects.length > 0) {
        // Find the updated project in the user's projects
        const projectIndex = userProjects.findIndex(
          (p) => p._id === data.projectId
        );

        if (projectIndex !== -1) {
          // Create a copy of user projects
          const updatedProjects = [...userProjects];

          // Update the metrics for the specific project
          updatedProjects[projectIndex] = {
            ...updatedProjects[projectIndex],
            metrics: {
              ...updatedProjects[projectIndex].metrics,
              cumulativeProfit:
                data.metrics.cumulativeProfit ||
                updatedProjects[projectIndex].metrics?.cumulativeProfit ||
                0,
              tradingVolume:
                data.metrics.tradingVolume ||
                updatedProjects[projectIndex].metrics?.tradingVolume ||
                0,
              activeBots:
                data.metrics.activeBots ||
                updatedProjects[projectIndex].metrics?.activeBots ||
                0,
              lastUpdate:
                data.metrics.lastUpdate ||
                updatedProjects[projectIndex].metrics?.lastUpdate ||
                new Date().toISOString(),
            },
          };

          // Recalculate total profit
          const newTotalProfit = updatedProjects.reduce(
            (total, project) =>
              total + (project.metrics?.cumulativeProfit || 0),
            0
          );

          // Update the state with the new total profit
          setUpdatedTotalProfit(newTotalProfit);
        }
      }
    },
    [userProjects]
  );

  // Setup WebSocket connections and subscriptions for all user projects
  useEffect(() => {
    if (!isAuthenticated || !isConnected || !userProjects.length) return;

    // Ensure WebSocket is connected
    websocketService.connect();

    // Join rooms for all user projects
    userProjects.forEach((project) => {
      websocketService.joinProject(project._id);
    });

    // Subscribe to metrics updates
    websocketService.subscribe(
      WebSocketEvents.PROJECT_METRICS_UPDATED,
      handleMetricsUpdate
    );

    // Cleanup on unmount
    return () => {
      websocketService.unsubscribe(
        WebSocketEvents.PROJECT_METRICS_UPDATED,
        handleMetricsUpdate
      );

      // Leave project rooms
      userProjects.forEach((project) => {
        websocketService.leaveProject(project._id);
      });
    };
  }, [isAuthenticated, isConnected, userProjects, handleMetricsUpdate]);

  // Helper function to check if a route is active
  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const onNavigateTo = (path: string) => {
    router.push(path);
    if (sidebarRef.current) {
      sidebarRef.current.toggleSidebar();
    }
  };

  // Don't render sidebar on splash page
  if (pathname === '/splash') {
    return null;
  }

  return (
    <Sidebar ref={sidebarRef} collapsible={isMobile ? 'offcanvas' : 'icon'}>
      <SidebarHeader className="px-2 py-4 relative w-full">
        <div className="flex justify-between items-center h-8">
          {open &&
            (mounted ? (
              <Link href="/" onClick={() => onNavigateTo('/')}>
                <Logo />
              </Link>
            ) : (
              <div className="w-[136px] h-[32px]" />
            ))}
          <SidebarTrigger className="h-9 w-9 flex items-center justify-center" />
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col h-full">
        <div className="px-2">
          <SidebarMenuButton
            onClick={() => onNavigateTo('/')}
            className={cn(
              'flex items-center',
              isActive('/', true) &&
                'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
            )}
          >
            <HomeIcon className="h-4 w-4" />
            <span>Dashboard</span>
          </SidebarMenuButton>

          <SidebarMenuButton
            onClick={() => onNavigateTo('/portfolio')}
            className={cn(
              'flex items-center',
              isActive('/portfolio') &&
                'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
            )}
          >
            <Wallet className="h-4 w-4" />
            <span className="text-sm">Portfolio</span>
          </SidebarMenuButton>

          <SidebarMenuButton
            onClick={() => {}} // Clickable but does nothing
            className={cn(
              'flex items-center',
              isActive('/swap') &&
                'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
            )}
          >
            <FiRepeat className="h-4 w-4" />
            {/* <Repeat2 className="h-4 w-4" /> */}
            <span className="text-sm">Swap</span>
            <span className="ml-auto px-1.5 py-0.5 text-xs rounded bg-yellow-200 text-yellow-800 font-semibold whitespace-nowrap">
              Coming Soon
            </span>
          </SidebarMenuButton>

          {/* Strategy Packs with submenu */}
          <Collapsible
            open={openPacks && open}
            onOpenChange={(isOpen) => {
              setOpenPacks(isOpen);
              if (isOpen && !open) {
                setOpen(true);
              }
            }}
          >
            <CollapsibleTrigger
              className={cn(
                'flex items-center justify-between w-full px-2 py-1 h-8 rounded-md',
                'hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground',
                // Only highlight parent when on general pack pages, not specific pack pages
                pathname === '/packs' &&
                  'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                <MdOutlineWidgets className="h-4 w-4" />
                {open && <span className="text-sm">Strategy Packs</span>}
              </div>
              {open && (
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    openPacks && 'transform rotate-180'
                  )}
                />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="ml-4 border-l-[1px]">
                {/* Your Projects submenu */}
                {isAuthenticated && (
                  <Collapsible
                    open={openYourPacks}
                    onOpenChange={setOpenYourPacks}
                  >
                    <CollapsibleTrigger
                      className={cn(
                        'flex items-center justify-between w-full pl-4 pr-2 py-1 h-8 text-sm rounded-md',
                        'text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground',
                        // Removed background color on open state to only show on hover/active
                        isActive('/your-packs') &&
                          'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                      )}
                    >
                      <span>Your Packs</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          openYourPacks && 'transform rotate-180'
                        )}
                      />
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      {filteredAndSortedPacks &&
                      filteredAndSortedPacks.length > 0 ? (
                        <>
                          {filteredAndSortedPacks.map((pack) => (
                            <SidebarMenuButton
                              key={pack._id}
                              onClick={() => onNavigateTo(`/packs/${pack._id}`)}
                              className={cn(
                                'flex items-center justify-between w-full pl-6 pr-2 h-8 py-2 text-sm rounded-md',
                                pathname === `/packs/${pack._id}` &&
                                  'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="relative"
                                  title={`Status: ${pack.status}`}
                                >
                                  <Circle
                                    className={`h-4 w-4 ${
                                      pack.status === 'active'
                                        ? 'text-green-500 animate-pulse'
                                        : 'text-gray-400'
                                    }`}
                                  />
                                </span>
                                <span className="text-xs">
                                  {pack.name.length > 12
                                    ? pack.name.slice(0, 10) + '...'
                                    : pack.name}
                                </span>
                              </div>
                              <Badge
                                variant={getBadgeVariant(pack.status)}
                                className="text-[10px] rounded-full"
                                size="default"
                              >
                                {pack.status}
                              </Badge>
                            </SidebarMenuButton>
                          ))}
                        </>
                      ) : (
                        <div className="px-6 py-2 text-sm h-8 text-muted-foreground flex items-center">
                          No packs found
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}
                <button
                  onClick={() => onNavigateTo('/public-packs')}
                  className={cn(
                    'flex items-center w-full px-4 py-1 h-8 text-sm rounded-md',
                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground',
                    isActive('/public-packs') &&
                      'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                  )}
                >
                  View all packs
                </button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Projects with submenu */}
          <Collapsible
            open={openProjects && open}
            onOpenChange={(isOpen) => {
              setOpenProjects(isOpen);
              if (isOpen && !open) {
                setOpen(true);
              }
            }}
            // className={(openProjects && open) ? `dark:bg-sidebar-accent dark:text-sidebar-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground` : ''}
          >
            <CollapsibleTrigger
              className={cn(
                'flex items-center justify-between w-full px-2 py-1 h-8 rounded-md',
                'hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground',
                // Only highlight parent when on general projects overview page (if it exists)
                // Don't highlight when on Fee Calculator, View all projects, or specific project pages
                pathname === '/projects' &&
                  'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                {open && <span className="text-sm">Projects</span>}
              </div>
              {open && (
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    openProjects && 'transform rotate-180'
                  )}
                />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="ml-4 border-l-[1px]">
                {/* Fee Calculator */}
                <SidebarMenuButton
                  onClick={() => onNavigateTo('/projects/fee-calculator')}
                  className={cn(
                    'flex items-center',
                    isActive('/projects/fee-calculator') &&
                      'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                  )}
                >
                  <Calculator className="h-4 w-4 ml-2" />
                  <span className="text-sm">Fee Calculator</span>
                </SidebarMenuButton>

                {/* Your Projects submenu */}
                {isAuthenticated && (
                  <Collapsible
                    open={openYourProjects}
                    onOpenChange={setOpenYourProjects}
                  >
                    <CollapsibleTrigger
                      className={cn(
                        'flex items-center justify-between w-full pl-4 pr-2 py-1 h-8 text-sm rounded-md',
                        'text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground',
                        // Only highlight when on general your projects route (if it exists)
                        isActive('/your-projects') &&
                          'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                      )}
                    >
                      <span>Your Projects</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          openYourProjects && 'transform rotate-180'
                        )}
                      />
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      {filteredAndSortedProjects &&
                      filteredAndSortedProjects.length > 0 ? (
                        <>
                          {filteredAndSortedProjects.map((project) => (
                            <SidebarMenuButton
                              key={project._id}
                              onClick={() =>
                                onNavigateTo(`/projects/${project._id}`)
                              }
                              className={cn(
                                'flex items-center justify-between w-full pl-6 pr-2 h-8 py-2 text-sm rounded-md',
                                pathname === `/projects/${project._id}` &&
                                  'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="relative"
                                  title={`Status: ${project.status}`}
                                >
                                  <Circle
                                    className={`h-4 w-4 ${
                                      project.status === 'active'
                                        ? 'text-green-500 animate-pulse'
                                        : 'text-gray-400'
                                    }`}
                                  />
                                </span>
                                <span className="text-xs">
                                  {project.name.length > 12
                                    ? project.name.slice(0, 10) + '...'
                                    : project.name}
                                </span>
                              </div>
                              <Badge
                                variant={getBadgeVariant(project.status)}
                                className="text-[10px] rounded-full"
                                size="default"
                              >
                                {project.status}
                              </Badge>
                            </SidebarMenuButton>
                          ))}
                        </>
                      ) : (
                        <div className="px-6 py-2 text-sm h-8 text-muted-foreground flex items-center">
                          No projects found
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* View all projects */}
                <button
                  onClick={() => onNavigateTo('/public-projects')}
                  className={cn(
                    'flex items-center w-full px-4 py-1 h-8 text-sm rounded-md',
                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground',
                    isActive('/public-projects') &&
                      'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                  )}
                >
                  View all projects
                </button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Knowledge Base with submenu */}
          <Collapsible
            open={openKnowledge && open}
            onOpenChange={(isOpen) => {
              setOpenKnowledge(isOpen);
              if (isOpen && !open) {
                setOpen(true);
              }
            }}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 h-8 hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground rounded-md">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {open && <span className="text-sm">Knowledge Base</span>}
              </div>
              {open && (
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    openKnowledge && 'transform rotate-180'
                  )}
                />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="ml-4 border-l-[1px]">
                <SidebarMenuButton
                  onClick={() => onNavigateTo('/tutorials')}
                  className={cn(
                    'flex items-center w-full px-4 py-1 h-8 text-sm rounded-md',
                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground',
                    isActive('/tutorials') &&
                      'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span className="text-sm">Tutorials</span>
                  </div>
                </SidebarMenuButton>
                <SidebarMenuButton
                  onClick={() => onNavigateTo('/faqs')}
                  className={cn(
                    'flex items-center w-full px-4 py-1 h-8 text-sm rounded-md',
                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground',
                    isActive('/faqs') &&
                      'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span className="text-sm">FAQs</span>
                  </div>
                </SidebarMenuButton>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Ambassador Program with submenu */}
          <Collapsible
            open={openAmbassador && open}
            onOpenChange={(isOpen) => {
              setOpenAmbassador(isOpen);
              if (isOpen && !open) {
                setOpen(true);
              }
            }}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 h-8 hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground rounded-md">
              <div className="flex items-center gap-2">
                <LuClipboardPen className="w-4 h-4" />
                {open && <span className="text-sm">Ambassador Program</span>}
              </div>
              {open && (
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    openAmbassador && 'transform rotate-180'
                  )}
                />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="ml-4 border-l-[1px]">
                <SidebarMenuButton
                  onClick={() => onNavigateTo('/ambassador/')}
                  className={cn(
                    'flex items-center w-full px-4 py-1 h-8 text-sm rounded-md',
                    'hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground',
                    isActive('/ambassador', true) &&
                      'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                  )}
                >
                  <LuUsersRound className="w-4 h-4" />
                  <span className="text-sm ml-2">Overview</span>
                </SidebarMenuButton>
                <SidebarMenuButton
                  onClick={() => onNavigateTo('/ambassador/referral')}
                  className={cn(
                    'flex items-center w-full px-4 py-1 h-8 text-sm rounded-md',
                    'hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground',
                    isActive('/ambassador/referral') &&
                      'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                  )}
                >
                  <IoIosLink className="w-4 h-4" />
                  <span className="text-sm  ml-2">Referral</span>
                </SidebarMenuButton>
                <SidebarMenuButton
                  onClick={() => onNavigateTo('/ambassador/widget-config')}
                  className={cn(
                    'flex items-center w-full px-4 py-1 h-8 text-sm rounded-md',
                    'hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground',
                    isActive('/ambassador/widget-config') &&
                      'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                  )}
                >
                  <MdOutlineWidgets className="w-4 h-4" />
                  <span className="text-sm  ml-2">Widget Configuration</span>
                </SidebarMenuButton>
                <SidebarMenuButton
                  onClick={() => onNavigateTo('/ambassador/widget-preview')}
                  className={cn(
                    'flex items-center w-full px-4 py-1 h-8 text-sm rounded-md',
                    'hover:bg-accent hover:text-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground',
                    isActive('/ambassador/widget-preview') &&
                      'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
                  )}
                >
                  <LuPlay className="w-4 h-4" />
                  <span className="text-sm ml-2">Widget Preview</span>
                </SidebarMenuButton>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Settings */}
          <SidebarMenuButton
            onClick={() => onNavigateTo('/settings')}
            className={cn(
              'flex items-center',
              isActive('/settings') &&
                'dark:bg-sidebar-accent dark:text-sidebar-accent-foreground'
            )}
          >
            {/* <Settings className="h-4 w-4" /> */}
            <LuSettings2 className="h-4 w-4" />
            <span className="text-sm">Settings</span>
          </SidebarMenuButton>

          {/* Admin */}
          {isAdmin && (
            <SidebarMenuButton className="flex items-center ">
              <Settings className="h-4 w-4" />
              <span
                className="text-sm"
                onClick={() => onNavigateTo('/fee-management')}
              >
                Fee Management
              </span>
            </SidebarMenuButton>
          )}
        </div>

        {/* Profile section at the bottom */}
        <div className="mt-auto px-2">
          {open && (
            <>
              {isAuthenticated && isConnected && user ? (
                <Card className="border bg-card text-card-foreground mb-4">
                  <CardContent className="p-4 space-y-4">
                    <WalletDisplay variant="sidebar" />

                    <div className="flex justify-between">
                      <div>
                        <p className="text-[12px] text-muted-foreground">
                          Active Projects
                        </p>
                        <p className="text-[12px] font-medium">
                          {activeProjects?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] text-muted-foreground">
                          Total Profit
                        </p>
                        <p className="text-[12px] font-medium text-right">
                          ${Number(totalProfit || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-sm text-muted-foreground flex flex-col items-center justify-center gap-2 mb-4">
                  <WalletConnectionButton variant="default" />
                  <p className="text-xs mx-4 text-center text-muted-foreground">
                    Connect your wallet and login to see your profile
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
