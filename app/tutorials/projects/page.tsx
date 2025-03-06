"use client"

import { PageHeader } from "@/components/layout/page-header"

export default function ProjectsTutorialPage() {
  return (
    <div className="container mx-auto py-6">
        <PageHeader title="Projects Tutorial" />

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

