"use client"

import { createContext, useContext, useState, type ReactNode, useMemo } from "react"

interface SessionContextType {
  session: any | null
  setSession: (session: any | null) => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(null)

  const contextValue = useMemo<SessionContextType>(
    () => ({
      session,
      setSession,
    }),
    [session],
  )

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}

