'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function BoostTokenDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 m-2 w-fit">
          Boost Your Token
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Boost Your Token</DialogTitle>
          <DialogDescription>
            Boost your token to increase visibility and engagement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="tokenAmount" className="text-right">
              Token Amount:
            </label>
            <input
              id="tokenAmount"
              className="col-span-3 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter token amount"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="duration" className="text-right">
              Duration:
            </label>
            <select
              id="duration"
              className="col-span-3 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="24">24 hours</option>
              <option value="48">48 hours</option>
              <option value="72">72 hours</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Boost Now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
