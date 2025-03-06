import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface ProjectDialogProps {
  project: {
    id: string
    name: string
    contractAddress: string
    network: string
    launchDate: string
    status: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectDialog({ project, open, onOpenChange }: ProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>Project details and performance metrics</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Contract:</span>
            <span className="col-span-3">{project.contractAddress}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Network:</span>
            <span className="col-span-3">{project.network}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Launch Date:</span>
            <span className="col-span-3">{project.launchDate}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Status:</span>
            <Badge variant={project.status === "Active" ? "default" : "secondary"}>{project.status}</Badge>
          </div>
        </div>
        {/* Add more project details and metrics here */}
      </DialogContent>
    </Dialog>
  )
}

