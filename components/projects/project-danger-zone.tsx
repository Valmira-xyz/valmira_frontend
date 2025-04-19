'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';

import { AlertTriangle, Trash2 } from 'lucide-react';
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
import { deleteProject } from '@/store/slices/projectSlice';
import { RootState } from '@/store/store';
import { ProjectWithAddons } from '@/types';

export function ProjectDangerZone({ project }: { project: ProjectWithAddons }) {
  const [tokenNameInput, setTokenNameInput] = useState('');
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDestroyProject = async () => {
    if (!isProjectOwner) return;
    try {
      setIsDeleting(true);
      await dispatch(deleteProject(project?._id) as any);
      toast({
        title: 'Project Deleted',
        description: 'Project has been successfully deleted.',
      });
      // Navigate back to projects list
      router.push('/projects');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
      console.error('Error deleting project:', error);
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="md:mt-4 w-full md:w-auto">
              <Trash2 className="mr-2 h-4 w-4" /> Stop/Destroy Project
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Permanently Destroy Project
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently stop all
                bots, withdraw funds, and delete all project data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  To confirm, please type the project name:{' '}
                  <span className="font-bold">{project?.name}</span>
                </p>
                <Input
                  value={tokenNameInput}
                  onChange={handleTokenNameChange}
                  placeholder="Enter project name"
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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => isProjectOwner && handleDestroyProject()}
                disabled={!isValid || isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Yes, destroy project'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
