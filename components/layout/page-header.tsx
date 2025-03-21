"use client"

import type React from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ProjectSearch } from "@/components/projects/project-search"

interface PageHeaderProps {
  title: string
  showSearch?: boolean
  children?: React.ReactNode
}

export function PageHeader({ title, showSearch = false, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between h-14 px-4 border-b">
      <div className="flex items-center">
        <SidebarTrigger className="h-9 w-9 -ml-10 flex items-center justify-center mr-2" />
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {showSearch && <ProjectSearch />}
        {children}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
          <span className="sr-only">Notifications</span>
        </Button>
        <ThemeToggle />
      </div>
    </div>
  )
}

