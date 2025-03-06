import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ProjectActionBarProps {
  project?: any
}

export function ProjectActionBar({ project }: ProjectActionBarProps) {
  if (!project) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((index) => (
              <Skeleton key={index} className="h-10 w-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Edit Project</Button>
          <Button variant="outline">Manage Bots</Button>
          <Button variant="outline">View Transactions</Button>
          <Button variant="outline">Export Data</Button>
        </div>
      </CardContent>
    </Card>
  )
}

