'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';

import { Plus } from 'lucide-react';

import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RootState } from '@/store/store';

export function CreateProjectButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Get auth state from Redux store
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();

  return (
    <>
      <Button
        onClick={() =>
          isAuthenticated
            ? setIsDialogOpen(true)
            : toast({
                title: 'Invalid Wallet',
                description:
                  'Connect your wallet and sign in to create a project',
                variant: 'destructive',
              })
        }
        variant="default"
      >
        <Plus className="mr-2 h-4 w-4" /> Create New Project
      </Button>
      <CreateProjectModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
