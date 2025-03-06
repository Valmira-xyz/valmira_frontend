"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/alert-dialog"
import { Trash2, AlertTriangle } from "lucide-react"

interface ProjectDangerZoneProps {
  projectName: string
  projectId: string
}

export function ProjectDangerZone({ projectName, projectId }: ProjectDangerZoneProps) {
  const [tokenNameInput, setTokenNameInput] = useState("")
  const [confirmationPhrase, setConfirmationPhrase] = useState("")
  const [isValid, setIsValid] = useState(false)

  const handleInputChange = () => {
    // Check if both inputs match the required values
    const isTokenNameValid = tokenNameInput === projectName
    const isPhraseValid = confirmationPhrase === "I understand the consequences"
    setIsValid(isTokenNameValid && isPhraseValid)
  }

  const handleTokenNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenNameInput(e.target.value)
    handleInputChange()
  }

  const handlePhraseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmationPhrase(e.target.value)
    handleInputChange()
  }

  const handleDestroyProject = () => {
    console.log(`Project ${projectId} (${projectName}) destroyed`)
    // Reset form
    setTokenNameInput("")
    setConfirmationPhrase("")
    setIsValid(false)
  }

  return (
    <Card className="border-destructive/20 bg-destructive/5 mt-16">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </div>
        <CardDescription>
          Actions in this section are destructive and cannot be undone. Please proceed with caution.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto">
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
                This action cannot be undone. This will permanently stop all bots, withdraw funds, and delete all
                project data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  To confirm, please type the project name: <span className="font-bold">{projectName}</span>
                </p>
                <Input
                  value={tokenNameInput}
                  onChange={handleTokenNameChange}
                  placeholder="Enter project name"
                  className="border-destructive/50 focus-visible:ring-destructive/30"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Type &quot;I understand the consequences&quot;</p>
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
                onClick={handleDestroyProject}
                disabled={!isValid}
                className="bg-destructive hover:bg-destructive/90"
              >
                Yes, destroy project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

