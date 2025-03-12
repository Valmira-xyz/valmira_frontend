import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ProjectHeaderProps {
  project?: {
    name?: string
    logo?: string
    blockchain?: number
    contractAddress?: string
    status?: "Active" | "Pending" | "Paused"
    lastUpdated?: string
  }
  walletAddress?: string
}

export function ProjectHeader({ project, walletAddress }: ProjectHeaderProps) {
  if (!project) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="mt-2 h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="mt-4 flex justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* <img
              src={project.logo || "/placeholder.svg?height=48&width=48"}
              alt={project.name || "Project"}
              className="h-12 w-12 rounded-full"
            /> */}
            <div>
              <h1 className="text-2xl font-bold">{project.name || "Untitled Project"}</h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {project.blockchain && (
                  <img
                    src={`/blockchain-icons/${project.blockchain}.svg`}
                    alt={project.blockchain.toString()}
                    className="h-4 w-4"
                  />
                )}
                <span>{project.contractAddress || "No contract address"}</span>
              </div>
            </div>
          </div>
          <Badge
            variant={project.status === "Active" ? "default" : project.status === "Pending" ? "secondary" : "outline"}
          >
            {project.status || "Unknown"}
          </Badge>
        </div>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          {/* <span>Connected Wallet: {walletAddress || "Not connected"}</span> */}
          <span>Last Updated: {project.lastUpdated ? new Date(project.lastUpdated).toLocaleString() : "Never"}</span>
        </div>
      </CardContent>
    </Card>
  )
}

