"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"

export function CreateProjectButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Create New Project
      </Button>
      <CreateProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}

