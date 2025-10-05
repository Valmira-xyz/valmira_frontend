'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { deletePack } from '@/store/slices/projectSlice';
import { RootState } from '@/store/store';
import { ProjectWithAddons } from '@/types';

export function PackDangerZone({ project }: { project: ProjectWithAddons }) {
  const [tokenNameInput, setTokenNameInput] = useState('');
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);

  const isProjectOwner = useMemo(() => {
    if (!user || !project || !project.owner) return false;

    const ownerWalletAddress =
      typeof project.owner === 'string'
        ? project.owner
        : project.owner.walletAddress;

    return (
      user.walletAddress?.toLowerCase() === ownerWalletAddress?.toLowerCase()
    );
  }, [user, project]);

  // Use useEffect to validate inputs whenever they change
  useEffect(() => {
    const isTokenNameValid = tokenNameInput === project?.name;
    const isPhraseValid =
      confirmationPhrase === 'I understand the consequences';
    setIsValid(isTokenNameValid && isPhraseValid);
  }, [tokenNameInput, confirmationPhrase, project?.name]);

  const handleTokenNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenNameInput(e.target.value);
  };

  const handlePhraseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmationPhrase(e.target.value);
  };

  const handleDestroyPack = async () => {
    if (!isProjectOwner) return;
    try {
      setIsDeleting(true);
      await dispatch(deletePack(project?._id) as any);

      // Emit custom event to notify sidebar about pack deletion
      window.dispatchEvent(new CustomEvent('packsChanged'));

      toast({
        title: 'Pack Deleted',
        description: 'Pack has been successfully deleted.',
      });
      // Navigate back to public-packs list
      router.push('/public-packs');
    } catch (error: any) {
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to delete pack. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Reset form
      setTokenNameInput('');
      setConfirmationPhrase('');
      setIsValid(false);
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/20 bg-destructive/5 mt-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </div>
        <CardDescription>
          Actions in this section are destructive and cannot be undone. Please
          proceed with caution.
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full md:w-auto">
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="md:mt-4 w-full md:w-auto"
              onClick={(e) => {
                e.preventDefault();
                if (!isProjectOwner) {
                  toast({
                    title: 'Permission Denied',
                    description: 'Only the pack owner can destroy this pack.',
                    variant: 'destructive',
                  });
                  return;
                }
                setOpen(true);
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting Pack...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Stop/Destroy Pack
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Permanently Destroy Pack
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently stop all
                bots, withdraw funds, and delete all pack data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  To confirm, please type the pack name:{' '}
                  <span className="font-bold">{project?.name}</span>
                </p>
                <Input
                  value={tokenNameInput}
                  onChange={handleTokenNameChange}
                  placeholder="Enter pack name"
                  className="border-destructive/50 focus-visible:ring-destructive/30"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Type &quot;I understand the consequences&quot;
                </p>
                <Input
                  value={confirmationPhrase}
                  onChange={handlePhraseChange}
                  placeholder="I understand the consequences"
                  className="border-destructive/50 focus-visible:ring-destructive/30"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setOpen(false);
                  setIsValid(false);
                  setConfirmationPhrase('');
                  setTokenNameInput('');
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => isProjectOwner && handleDestroyPack()}
                disabled={!isValid || isDeleting}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting Pack...
                  </>
                ) : (
                  'Yes, destroy pack'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
