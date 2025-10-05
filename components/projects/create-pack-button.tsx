'use client';

import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { Plus } from 'lucide-react';

import { CreateStrategyPackModal } from '@/components/strategy-packs/pack-create-modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RootState } from '@/store/store';

export function CreatePackButton({
  buttonText = 'Create New Pack',
  variant = 'secondary',
}: {
  buttonText?: string;
  variant?: 'default' | 'secondary';
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Get auth state from Redux store
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();

  const handleDialogToggle = useCallback(() => {
    console.log('handleDialogToggle invoked => ', isDialogOpen);
    setIsDialogOpen(!isDialogOpen);
  }, [isDialogOpen]);

  return (
    <>
      <Button
        onClick={() =>
          isAuthenticated
            ? handleDialogToggle()
            : toast({
                title: 'Invalid Wallet',
                description: 'Connect your wallet and sign in to create a pack',
                variant: 'destructive',
              })
        }
        variant={variant}
      >
        <Plus className="h-4 w-4" /> {buttonText}
      </Button>
      <CreateStrategyPackModal
        isOpen={isDialogOpen}
        onClose={handleDialogToggle}
      />
    </>
  );
}
