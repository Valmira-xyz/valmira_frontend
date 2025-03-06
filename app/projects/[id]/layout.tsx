import type React from "react"
import { RealTimeDataProvider } from "@/components/projects/real-time-data-provider"

export default function ProjectLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  return <RealTimeDataProvider projectId={params.id}>{children}</RealTimeDataProvider>
}

