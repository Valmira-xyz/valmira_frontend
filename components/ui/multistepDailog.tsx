'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function MultiStepDialog() {
  const [step, setStep] = useState(1);

  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => s - 1);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Multi-Step Form</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Step {step} of 3</DialogTitle>
          <DialogDescription>
            Fill in your details step-by-step.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div>
            <label>Name</label>
            <input
              className="w-full border p-2 rounded"
              placeholder="Your name"
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <label>Email</label>
            <input
              className="w-full border p-2 rounded"
              placeholder="Your email"
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <label>Summary</label>
            <p>Name and email will be submitted</p>
          </div>
        )}

        <DialogFooter className="mt-4">
          {step > 1 && (
            <Button variant="outline" onClick={prev}>
              Back
            </Button>
          )}
          {step < 3 && <Button onClick={next}>Next</Button>}
          {step === 3 && (
            <DialogClose asChild>
              <Button type="submit">Submit</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
