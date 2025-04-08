"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDispatch, useSelector } from 'react-redux'
import { fetchProjects } from '@/store/slices/projectSlice'
import type { RootState } from '@/store/store'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface DashboardSidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardSidebar({ className, ...props }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch()
  const { projects, loading } = useSelector((state: RootState) => state.projects)

  useEffect(() => {
    dispatch(fetchProjects() as any)
  }, [dispatch])

  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Projects
          </h2>
          <div className="space-y-1">
            <Button
              variant={pathname === "/dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => router.push('/dashboard')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              Overview
            </Button>
            <Button
              variant={pathname === "/dashboard/new" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => router.push('/dashboard/new')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Project
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Your Projects
          </h2>
          <ScrollArea className="h-[300px] px-1">
            <div className="space-y-1">
              {loading ? (
                <div className="animate-pulse space-y-2 px-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                projects.map((project) => (
                  <Button
                    key={project._id}
                    variant={pathname === `/projects/${project._id}` ? "secondary" : "ghost"}
                    className="w-full justify-start font-normal"
                    onClick={() => router.push(`/projects/${project._id}`)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4"
                    >
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                    {project.name}
                    {project.status === 'active' && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-green-500" />
                    )}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}