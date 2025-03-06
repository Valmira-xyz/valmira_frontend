"use client"

import { Bell } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export default function ProjectsTutorialPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="relative z-20" />
          <h1 className="text-3xl font-bold">Projects Tutorial</h1>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <h2>Creating and Managing Projects</h2>
        <p>
          This tutorial will guide you through the process of creating and managing projects on the Valmira platform.
          You'll learn how to create new projects, configure their settings, and monitor their performance.
        </p>

        {/* Tutorial content would go here */}
        <div className="bg-muted p-6 rounded-lg my-6">
          <p className="text-center text-muted-foreground">Tutorial content is being developed.</p>
        </div>
      </div>
    </div>
  )
}

