import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { generateAvatarColor, getBadgeVariant } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ProjectWithAddons, ProjectHeaderProps } from "@/types"

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
                <Avatar className="h-12 w-12">
                  <AvatarFallback style={{ backgroundColor: generateAvatarColor(typeof project.owner === 'string' ? project.owner : project.owner.walletAddress) }}>
                    {typeof project.owner === 'string' 
                      ? project.owner.slice(2, 4).toUpperCase() 
                      : project.owner.walletAddress.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{project.name || "Untitled Project"}</h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {project?.chainId && (
                  <img
                    src={`/blockchain-icons/${project.chainId}.svg`}
                    alt={project.chainId.toString()}
                    className="h-4 w-4"
                  />
                )}
                <span>{project.tokenAddress || "No token address"}</span>
              </div>
            </div>
          </div>
          <Badge variant={getBadgeVariant(project.status)} className="font-medium text-sm px-3 py-1 rounded-full">
            {project.status}
          </Badge>
        </div>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          {/* <span>Connected Wallet: {walletAddress || "Not connected"}</span> */}
          <span>Last Updated: {project.updatedAt ? new Date(project.updatedAt).toLocaleString() : "Never"}</span>
        </div>
      </CardContent>
    </Card>
  )
}

