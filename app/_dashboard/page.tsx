// 'use client'

// import { useState } from 'react'

// import { Button } from '@/components/ui/button'
// import { Dialog } from '@/components/ui/dialog'
// import { Input } from '@/components/ui/input'
// import { cn } from '@/lib/utils'

// export default function DashboardPage() {
//   const [isOpen, setIsOpen] = useState(false)

//   return (
//     <div className="flex flex-col gap-4 p-4">
//       <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>

//       <Dialog
//         open={isOpen}
//         onOpenChange={setIsOpen}
//         title="Dialog Title"
//         description="This is a description of the dialog"
//       >
//         <Input placeholder="Type something..." />
//         <Button className="mt-4" onClick={() => setIsOpen(false)}>
//           Close
//         </Button>
//       </Dialog>
//     </div>
//   )
// }
