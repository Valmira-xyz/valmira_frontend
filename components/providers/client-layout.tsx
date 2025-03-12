"use client"

import { useProjectSync } from "@/hooks/use-project-sync"
import { ReactNode } from "react"

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  // Initialize project sync
  useProjectSync()

  return <>{children}</>
} 