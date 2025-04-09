'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  AlertCircleIcon,
  BookOpen,
  ChevronDown,
  Circle,
  FolderKanban,
  HelpCircle,
  HomeIcon,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAccount } from 'wagmi';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { generateAvatarColor, getBadgeVariant } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Logo from '@/public/sidebar/logo.svg';
import { fetchProjects } from '@/store/slices/projectSlice';
import { RootState } from '@/store/store';

export function DashboardSidebar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isConnected } = useAccount();
  const [openProjects, setOpenProjects] = useState(true);
  const [openKnowledge, setOpenKnowledge] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const { open, setOpen, isMobile } = useSidebar();

  // Get auth state from Redux store
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const { projects, loading: projectsLoading } = useSelector(
    (state: RootState) => state.projects
  );

  // Fetch projects when component mounts
  useEffect(() => {
    if (isAuthenticated && isConnected) {
      dispatch(fetchProjects() as any);
    }
  }, [dispatch, isAuthenticated, isConnected]);

  // Filter projects to show only the authenticated user's projects,
  // sort by status (active first) then by updatedAt date (newest first),
  // and limit to 10 projects for the sidebar
  const filteredAndSortedProjects =
    projects
      ?.filter((project) => {
        // Check if project has owner property (from ProjectWithAddons interface)
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
        // If no owner field, fall back to userId (from Project interface)
        return project.userId === user?._id;
      })
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

  // Get all user projects for stats (without the 10 limit)
  const userProjects =
    projects?.filter((project) => {
      // Check if project has owner property (from ProjectWithAddons interface)
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
      // If no owner field, fall back to userId (from Project interface)
      return project.userId === user?._id;
    }) || [];

  const activeProjects = userProjects.filter(
    (project) => project.status === 'active'
  );
  const avatarColor = generateAvatarColor(user?.walletAddress || '');

  return (
    <Sidebar collapsible={isMobile ? 'offcanvas' : 'icon'}>
      <SidebarHeader className="px-2 py-4 relative w-full">
        <div className="flex justify-between items-center h-8">
          {open && (
            <Link href={'/'}>
              <Logo />
            </Link>
          )}
          <SidebarTrigger className="h-9 w-9 flex items-center justify-center" />
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col h-full">
        <div className="px-2">
          <SidebarMenuButton
            onClick={() => router.push('/')}
            className="flex items-center "
          >
            <HomeIcon className="h-4 w-4" />
            <span>Dashboard</span>
          </SidebarMenuButton>

          {/* Projects with submenu */}
          <Collapsible
            open={openProjects && open}
            onOpenChange={(isOpen) => {
              setOpenProjects(isOpen);
              if (isOpen && !open) {
                setOpen(true);
              }
            }}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1  h-8 hover:bg-accent hover:text-accent-foreground rounded-md">
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
                {filteredAndSortedProjects &&
                filteredAndSortedProjects.length > 0 ? (
                  <>
                    {filteredAndSortedProjects.map((project) => (
                      <button
                        key={project._id}
                        onClick={() => router.push(`/projects/${project._id}`)}
                        className="flex items-center justify-between w-full px-4 h-8 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
                      >
                        <div className="flex items-center">
                          <span
                            className="relative"
                            title={`Status: ${project.status}`}
                          >
                            <Circle
                              className={`h-2 w-2 ${
                                project.status === 'active'
                                  ? 'text-green-500 animate-pulse'
                                  : 'text-gray-400'
                              }`}
                            />
                          </span>
                          <span>{project.name}</span>
                        </div>
                        <Badge
                          variant={getBadgeVariant(project.status)}
                          className="font-medium text-sm px-3 py-1 rounded-full"
                        >
                          {project.status}
                        </Badge>
                      </button>
                    ))}
                    <button
                      onClick={() => router.push('/projects')}
                      className="flex items-center w-full px-4 py-2 h-8 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
                    >
                      Your projects
                    </button>
                    <button
                      onClick={() => router.push('/public-projects')}
                      className="flex items-center w-full px-4 py-2 h-8 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
                    >
                      View all projects
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 text-sm h-8 text-muted-foreground flex items-center">
                      {projects && projects.length === 0 && 'No projects found'}
                    </div>
                    <button
                      onClick={() => router.push('/public-projects')}
                      className="flex items-center w-full px-4 py-2 h-8 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
                    >
                      View all Projects...
                    </button>
                  </>
                )}
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
            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 h-8  hover:bg-accent hover:text-accent-foreground rounded-md">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {open && <span className="text-sm">Knowledge Base</span>}
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  openKnowledge && 'transform rotate-180'
                )}
              />
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="ml-4 border-l-[1px]">
                <button
                  onClick={() => router.push('/tutorials')}
                  className="flex items-center w-full px-4 py-2 h-8 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span className="text-sm">Tutorials</span>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/faqs')}
                  className="flex items-center w-full px-4 py-2 h-8 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span className="text-sm">FAQs</span>
                  </div>
                </button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Help & Support */}
          <SidebarMenuButton
            onClick={() => router.push('/faqs')}
            className="flex items-center "
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm">Help & Support</span>
          </SidebarMenuButton>

          {/* Settings */}
          <SidebarMenuButton
            onClick={() => router.push('/settings')}
            className="flex items-center "
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Settings</span>
          </SidebarMenuButton>
        </div>

        {/* Profile section at the bottom */}
        <div
          className={cn(
            'mx-4 mb-6 mt-auto border-border p-4 space-y-4 rounded-xl',
            open && 'border'
          )}
        >
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
                    {user.name ||
                      `${user.walletAddress.substring(
                        0,
                        6
                      )}...${user.walletAddress.substring(
                        user.walletAddress.length - 4
                      )}`}
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
                  <span className="font-medium">
                    $
                    {Number(
                      userProjects?.reduce(
                        (total, project) =>
                          total + (project.metrics?.cumulativeProfit || 0),
                        0
                      )
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            open && (
              <div className="text-sm text-muted-foreground">
                <p>Connect your wallet and login to see your profile</p>
              </div>
            )
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
