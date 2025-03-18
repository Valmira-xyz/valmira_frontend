import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    // Initial check
    setMatches(media.matches)
    
    // Add event listener
    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)
    
    // Cleanup
    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
} 